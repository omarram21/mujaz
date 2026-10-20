-- Phase 1: profiles, roles, and the auth → profile trigger.

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.gender as enum ('male', 'female');
create type public.learning_goal as enum ('ijazah', 'memorization', 'tajweed');
create type public.teaches_gender as enum ('male', 'female', 'both');
create type public.teacher_status as enum ('none', 'pending', 'approved', 'rejected');

-- Riwayat are data, not an enum, so adding one needs no migration.
create table public.riwayat (
  code text primary key,
  name_ar text not null,
  name_en text not null,
  sort int not null default 0
);
alter table public.riwayat enable row level security;
create policy "riwayat are public" on public.riwayat for select using (true);

insert into public.riwayat (code, name_ar, name_en, sort) values
  ('hafs', 'حفص عن عاصم', 'Hafs ʿan ʿAsim', 1),
  ('shuba', 'شعبة عن عاصم', 'Shuʿbah ʿan ʿAsim', 2),
  ('warsh', 'ورش عن نافع', 'Warsh ʿan Nafiʿ', 3),
  ('qalun', 'قالون عن نافع', 'Qalun ʿan Nafiʿ', 4),
  ('duri', 'الدوري عن أبي عمرو', 'al-Duri ʿan Abi ʿAmr', 5),
  ('susi', 'السوسي عن أبي عمرو', 'al-Susi ʿan Abi ʿAmr', 6),
  ('ten_minor', 'القراءات العشر الصغرى', 'The Ten Readings (al-Shatibiyyah & al-Durrah)', 7),
  ('ten_major', 'القراءات العشر الكبرى', 'The Ten Readings (al-Tayyibah)', 8);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null default '' check (char_length(full_name) <= 120),
  gender public.gender,
  country text check (country is null or char_length(country) = 2),
  timezone text not null default 'UTC',
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  goal public.learning_goal,
  preferred_riwayat text[] not null default '{}',
  -- Students: when true (default for female students) only female teachers are listed.
  female_teachers_only boolean not null default false,
  reminders_enabled boolean not null default true,
  onboarded boolean not null default false,
  -- Teacher fields (null/ignored for students)
  teacher_status public.teacher_status not null default 'none',
  teaches public.teaches_gender not null default 'both',
  headline text check (headline is null or char_length(headline) <= 160),
  bio text check (bio is null or char_length(bio) <= 2000),
  years_experience int check (years_experience is null or years_experience between 0 and 80),
  price_30 numeric(8, 2) check (price_30 is null or price_30 >= 0),
  price_60 numeric(8, 2) check (price_60 is null or price_60 >= 0),
  currency text not null default 'USD',
  accepting_bookings boolean not null default true,
  -- The approved sanad (copied from the approved application).
  sanad_text text,
  granting_sheikh text,
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  ijazahs_granted int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_public_teachers_idx on public.profiles (teacher_status, gender) where role = 'teacher';

-- Helpers ----------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- A user may edit their own profile but never their role, verification status, sanad,
-- or the counters maintained by triggers. Admins and service code (no auth.uid()) may.
create or replace function public.guard_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() or current_setting('mujaz.trusted', true) = 'on' then
    return new;
  end if;
  if new.role is distinct from old.role
     and not (old.role = 'student' and new.role = 'teacher' and old.teacher_status in ('none', 'rejected')) then
    raise exception 'role cannot be changed' using errcode = '42501';
  end if;
  if new.teacher_status is distinct from old.teacher_status
     or new.sanad_text is distinct from old.sanad_text
     or new.granting_sheikh is distinct from old.granting_sheikh
     or new.rating_avg is distinct from old.rating_avg
     or new.rating_count is distinct from old.rating_count
     or new.ijazahs_granted is distinct from old.ijazahs_granted then
    raise exception 'protected profile fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
for each row execute function public.guard_profile_columns();

-- New auth user → profile. Role comes from sign-up metadata but can only be student/teacher.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
begin
  insert into public.profiles (id, full_name, role, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when requested = 'teacher' then 'teacher'::public.user_role else 'student'::public.user_role end,
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS ---------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "own profile readable" on public.profiles
  for select using (id = auth.uid());

create policy "admins read all profiles" on public.profiles
  for select using (public.is_admin());

create policy "own profile updatable" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admins update profiles" on public.profiles
  for update using (public.is_admin());

-- Column exposure: approved teacher rows are public, but private fields must not leak.
-- Clients read other people's profiles through this view.
create view public.public_teachers with (security_invoker = false) as
  select id, full_name, gender, country, timezone, teaches, headline, bio, years_experience,
         price_30, price_60, currency, accepting_bookings, sanad_text, granting_sheikh,
         rating_avg, rating_count, ijazahs_granted, created_at
  from public.profiles
  where role = 'teacher' and teacher_status = 'approved';

grant select on public.public_teachers to anon, authenticated;
