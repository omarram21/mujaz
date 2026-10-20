-- Phase 2: teacher applications, availability, bookings, progress, ijazahs, reviews, push tokens.

create type public.application_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.booking_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.program_status as enum ('active', 'completed', 'abandoned');
create type public.session_quality as enum ('excellent', 'good', 'acceptable', 'repeat');
create type public.mistake_type as enum ('tajweed', 'hifz', 'harakah', 'waqf');
create type public.progress_status as enum ('draft', 'approved');

-- Teacher applications --------------------------------------------------------

create table public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'draft',
  gender public.gender,
  country text check (country is null or char_length(country) = 2),
  teaches public.teaches_gender not null default 'both',
  riwayat text[] not null default '{}',
  granting_sheikh text check (granting_sheikh is null or char_length(granting_sheikh) <= 200),
  sanad_text text check (sanad_text is null or char_length(sanad_text) <= 5000),
  headline text check (headline is null or char_length(headline) <= 160),
  bio text check (bio is null or char_length(bio) <= 2000),
  years_experience int check (years_experience is null or years_experience between 0 and 80),
  price_30 numeric(8, 2) check (price_30 is null or price_30 >= 0),
  price_60 numeric(8, 2) check (price_60 is null or price_60 >= 0),
  checklist jsonb not null default '{}',
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rejection_needs_reason check (status <> 'rejected' or coalesce(char_length(trim(rejection_reason)), 0) > 0)
);

-- One open (draft or pending) application per teacher.
create unique index teacher_applications_one_open
  on public.teacher_applications (teacher_id) where status in ('draft', 'pending');
create index teacher_applications_pending_idx on public.teacher_applications (submitted_at) where status = 'pending';

create trigger teacher_applications_touch before update on public.teacher_applications
for each row execute function public.touch_updated_at();

create table public.teacher_riwayat (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  riwayah text not null references public.riwayat (code),
  primary key (teacher_id, riwayah)
);

create table public.teacher_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.teacher_applications (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) <= 255),
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index teacher_documents_app_idx on public.teacher_documents (application_id);

-- Availability -----------------------------------------------------------------

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday, in the teacher's zone
  start_time time not null,
  end_time time not null,
  timezone text not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (extract(minute from start_time)::int % 30 = 0 and extract(minute from end_time)::int % 30 = 0)
);
create index availability_rules_teacher_idx on public.availability_rules (teacher_id, weekday);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index availability_exceptions_teacher_idx on public.availability_exceptions (teacher_id, starts_at);

-- Programs (a khatmah with one teacher in one riwayah) ----------------------------

create table public.ijazah_programs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  riwayah text not null references public.riwayat (code),
  status public.program_status not null default 'active',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index ijazah_programs_one_active
  on public.ijazah_programs (student_id, teacher_id, riwayah) where status = 'active';

-- Bookings ---------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid references public.ijazah_programs (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_min smallint not null check (duration_min in (30, 60)),
  status public.booking_status not null default 'scheduled',
  is_trial boolean not null default false,
  price numeric(8, 2) not null default 0,
  currency text not null default 'USD',
  daily_room_name text,
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  cancel_reason text,
  rescheduled_from uuid references public.bookings (id) on delete set null,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at = starts_at + make_interval(mins => duration_min)),
  check (student_id <> teacher_id),
  check (not is_trial or (duration_min = 30 and price = 0)),
  -- Double booking is impossible at the database level, for the teacher and for the student.
  constraint bookings_no_teacher_overlap exclude using gist (
    teacher_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('scheduled', 'completed')),
  constraint bookings_no_student_overlap exclude using gist (
    student_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('scheduled', 'completed'))
);
create index bookings_student_idx on public.bookings (student_id, starts_at);
create index bookings_teacher_idx on public.bookings (teacher_id, starts_at);
-- One free trial per student–teacher pair.
create unique index bookings_one_trial_per_pair
  on public.bookings (student_id, teacher_id) where is_trial and status <> 'cancelled';

-- Session progress & mistakes ------------------------------------------------------

create table public.session_progress (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  program_id uuid references public.ijazah_programs (id) on delete set null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  from_page smallint not null check (from_page between 1 and 604),
  to_page smallint not null check (to_page between 1 and 604),
  from_surah smallint check (from_surah between 1 and 114),
  from_ayah smallint check (from_ayah >= 1),
  to_surah smallint check (to_surah between 1 and 114),
  to_ayah smallint check (to_ayah >= 1),
  quality public.session_quality,
  note text check (note is null or char_length(note) <= 2000),
  status public.progress_status not null default 'draft',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (to_page >= from_page),
  check (status = 'draft' or quality is not null)
);
create index session_progress_program_idx on public.session_progress (program_id) where status = 'approved';
create index session_progress_student_idx on public.session_progress (student_id);

create trigger session_progress_touch before update on public.session_progress
for each row execute function public.touch_updated_at();

create table public.recitation_mistakes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  type public.mistake_type not null,
  surah smallint check (surah between 1 and 114),
  ayah smallint check (ayah >= 1),
  page smallint check (page between 1 and 604),
  description text not null check (char_length(description) between 1 and 300),
  created_at timestamptz not null default now()
);
create index recitation_mistakes_booking_idx on public.recitation_mistakes (booking_id, created_at);

-- Ijazahs ---------------------------------------------------------------------------

create table public.ijazahs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null unique references public.ijazah_programs (id) on delete restrict,
  student_id uuid references public.profiles (id) on delete set null,
  teacher_id uuid references public.profiles (id) on delete set null,
  riwayah text not null references public.riwayat (code),
  student_name text not null,
  teacher_name text not null,
  -- The teacher's sanad exactly as approved at issue time; never updated afterwards.
  sanad_snapshot text not null,
  granting_sheikh_snapshot text,
  pages_count smallint not null,
  sessions_count int not null,
  started_at timestamptz,
  issued_at timestamptz not null default now(),
  verification_code text not null unique,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null,
  revoke_reason text,
  check ((revoked_at is null) = (revoke_reason is null))
);
create index ijazahs_student_idx on public.ijazahs (student_id);

-- Reviews ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index reviews_teacher_idx on public.reviews (teacher_id, created_at desc);

-- Push tokens -------------------------------------------------------------------------

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
