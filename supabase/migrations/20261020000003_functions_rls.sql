-- Phase 2: business rules (RPCs, triggers) and row level security.

-- Gender matching ----------------------------------------------------------------
-- Mirrors src/lib/matching.ts. A student may see/book a teacher only when the teacher
-- teaches the student's gender, and — if the student chose "female teachers only" —
-- the teacher is female.
create or replace function public.teacher_matches(
  s_gender public.gender, s_female_only boolean, t_gender public.gender, t_teaches public.teaches_gender
) returns boolean language sql immutable as $$
  select (t_teaches = 'both' or s_gender is null or t_teaches::text = s_gender::text)
     and (not coalesce(s_female_only, false) or t_gender = 'female');
$$;

-- Public teacher directory (approved teachers only; private columns excluded) -------
drop view if exists public.public_teachers;
create view public.public_teachers with (security_invoker = false) as
  select p.id, p.full_name, p.gender, p.country, p.timezone, p.teaches, p.headline, p.bio,
         p.years_experience, p.price_30, p.price_60, p.currency, p.accepting_bookings,
         p.sanad_text, p.granting_sheikh, p.rating_avg, p.rating_count, p.ijazahs_granted, p.created_at,
         coalesce((select array_agg(tr.riwayah order by r.sort)
                   from public.teacher_riwayat tr join public.riwayat r on r.code = tr.riwayah
                   where tr.teacher_id = p.id), '{}') as riwayat
  from public.profiles p
  where p.role = 'teacher' and p.teacher_status = 'approved';
grant select on public.public_teachers to anon, authenticated;

-- Teachers the signed-in student is matched with.
create or replace function public.list_teachers(p_riwayah text default null, p_search text default null)
returns setof public.public_teachers
language sql stable security definer set search_path = public as $$
  select t.*
  from public.public_teachers t
  left join public.profiles me on me.id = auth.uid()
  where (me.id is null or me.role <> 'student'
         or public.teacher_matches(me.gender, me.female_teachers_only, t.gender, t.teaches))
    and (p_riwayah is null or p_riwayah = any (t.riwayat))
    and (p_search is null or p_search = ''
         or t.full_name ilike '%' || p_search || '%'
         or exists (select 1 from public.riwayat r
                    where r.code = any (t.riwayat) and (r.name_ar ilike '%' || p_search || '%'
                                                         or r.name_en ilike '%' || p_search || '%')))
  order by t.rating_avg desc, t.rating_count desc, t.full_name;
$$;
grant execute on function public.list_teachers(text, text) to authenticated;

-- Teacher applications ---------------------------------------------------------------

-- Submitting (draft → pending) validates the application and marks the profile pending.
create or replace function public.on_application_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status = 'pending' and old.status = 'draft' then
    if coalesce(array_length(new.riwayat, 1), 0) = 0
       or coalesce(trim(new.sanad_text), '') = ''
       or coalesce(trim(new.granting_sheikh), '') = ''
       or new.gender is null then
      raise exception 'application_incomplete' using errcode = '22023';
    end if;
    if not exists (select 1 from public.teacher_documents d where d.application_id = new.id) then
      raise exception 'application_needs_documents' using errcode = '22023';
    end if;
    new.submitted_at := now();
    perform set_config('mujaz.trusted', 'on', true);
    update public.profiles set teacher_status = 'pending'
      where id = new.teacher_id and teacher_status in ('none', 'rejected');
    perform set_config('mujaz.trusted', 'off', true);
  end if;
  return new;
end;
$$;
create trigger teacher_applications_status before update on public.teacher_applications
for each row execute function public.on_application_status();

create or replace function public.review_teacher_application(
  p_application_id uuid, p_approve boolean, p_reason text default null, p_checklist jsonb default '{}'
) returns public.teacher_applications
language plpgsql security definer set search_path = public as $$
declare
  app public.teacher_applications;
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  select * into app from public.teacher_applications where id = p_application_id for update;
  if not found or app.status <> 'pending' then
    raise exception 'application_not_pending' using errcode = '22023';
  end if;
  if not p_approve and coalesce(trim(p_reason), '') = '' then
    raise exception 'rejection_needs_reason' using errcode = '22023';
  end if;

  update public.teacher_applications
     set status = case when p_approve then 'approved'::public.application_status else 'rejected' end,
         rejection_reason = case when p_approve then null else trim(p_reason) end,
         checklist = coalesce(p_checklist, '{}'),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_application_id
  returning * into app;

  if p_approve then
    update public.profiles
       set role = 'teacher',
           teacher_status = 'approved',
           gender = coalesce(app.gender, gender),
           country = coalesce(app.country, country),
           teaches = app.teaches,
           headline = coalesce(app.headline, headline),
           bio = coalesce(app.bio, bio),
           years_experience = coalesce(app.years_experience, years_experience),
           price_30 = coalesce(app.price_30, price_30),
           price_60 = coalesce(app.price_60, price_60),
           sanad_text = app.sanad_text,
           granting_sheikh = app.granting_sheikh
     where id = app.teacher_id;
    delete from public.teacher_riwayat where teacher_id = app.teacher_id;
    insert into public.teacher_riwayat (teacher_id, riwayah)
      select app.teacher_id, r from unnest(app.riwayat) r
      where exists (select 1 from public.riwayat x where x.code = r)
      on conflict do nothing;
  else
    -- An already-approved teacher whose sanad update is rejected stays approved.
    update public.profiles set teacher_status = 'rejected'
     where id = app.teacher_id and teacher_status <> 'approved';
  end if;
  return app;
end;
$$;
grant execute on function public.review_teacher_application(uuid, boolean, text, jsonb) to authenticated;

-- Booking --------------------------------------------------------------------------

create or replace function public.slot_fits_availability(p_teacher uuid, p_start timestamptz, p_end timestamptz)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.availability_rules r
    where r.teacher_id = p_teacher
      and extract(dow from (p_start at time zone r.timezone))::int = r.weekday
      and (p_start at time zone r.timezone)::date = ((p_end - interval '1 microsecond') at time zone r.timezone)::date
      and (p_start at time zone r.timezone)::time >= r.start_time
      and (p_end at time zone r.timezone)::time <= r.end_time
      and (p_end at time zone r.timezone)::time > r.start_time
  )
  and not exists (
    select 1 from public.availability_exceptions e
    where e.teacher_id = p_teacher and tstzrange(e.starts_at, e.ends_at) && tstzrange(p_start, p_end)
  );
$$;

create or replace function public.ensure_program(p_student uuid, p_teacher uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
  chosen text;
begin
  select id into pid from public.ijazah_programs
   where student_id = p_student and teacher_id = p_teacher and status = 'active'
   order by started_at desc limit 1;
  if pid is not null then return pid; end if;

  select tr.riwayah into chosen
    from public.teacher_riwayat tr
    join public.riwayat r on r.code = tr.riwayah
    join public.profiles s on s.id = p_student
   where tr.teacher_id = p_teacher
   order by (tr.riwayah = any (s.preferred_riwayat)) desc, r.sort
   limit 1;
  if chosen is null then return null; end if;

  insert into public.ijazah_programs (student_id, teacher_id, riwayah)
  values (p_student, p_teacher, chosen) returning id into pid;
  return pid;
end;
$$;

create or replace function public.book_session(
  p_teacher_id uuid, p_starts_at timestamptz, p_duration int, p_is_trial boolean default false
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  me public.profiles;
  t public.profiles;
  b public.bookings;
  v_end timestamptz;
begin
  select * into me from public.profiles where id = auth.uid();
  if not found or me.role <> 'student' then
    raise exception 'students_only' using errcode = '42501';
  end if;
  select * into t from public.profiles where id = p_teacher_id and role = 'teacher' and teacher_status = 'approved';
  if not found then raise exception 'teacher_not_found' using errcode = '22023'; end if;
  if not t.accepting_bookings then raise exception 'teacher_not_accepting' using errcode = '22023'; end if;
  if not public.teacher_matches(me.gender, me.female_teachers_only, t.gender, t.teaches) then
    raise exception 'teacher_not_matched' using errcode = '42501';
  end if;
  if p_is_trial then p_duration := 30; end if;
  if p_duration not in (30, 60) then raise exception 'invalid_duration' using errcode = '22023'; end if;
  if extract(second from p_starts_at) <> 0 or extract(minute from p_starts_at)::int % 30 <> 0 then
    raise exception 'invalid_start' using errcode = '22023';
  end if;
  if p_starts_at < now() + interval '1 hour' or p_starts_at > now() + interval '60 days' then
    raise exception 'outside_booking_window' using errcode = '22023';
  end if;
  v_end := p_starts_at + make_interval(mins => p_duration);
  if not public.slot_fits_availability(p_teacher_id, p_starts_at, v_end) then
    raise exception 'slot_unavailable' using errcode = '22023';
  end if;

  begin
    insert into public.bookings (student_id, teacher_id, program_id, starts_at, ends_at, duration_min, is_trial, price, currency)
    values (me.id, t.id, public.ensure_program(me.id, t.id), p_starts_at, v_end, p_duration, p_is_trial,
            case when p_is_trial then 0 when p_duration = 30 then coalesce(t.price_30, 0) else coalesce(t.price_60, 0) end,
            t.currency)
    returning * into b;
  exception
    when exclusion_violation then
      raise exception 'slot_taken' using errcode = '23P01';
    when unique_violation then
      raise exception 'trial_already_used' using errcode = '23505';
  end;
  -- TODO(payments): attach a payment intent here (HyperPay / PayTabs / Tap — Stripe isn't available in Jordan).
  return b;
end;
$$;
grant execute on function public.book_session(uuid, timestamptz, int, boolean) to authenticated;

-- Students may cancel free of charge until 6 hours before the start; teachers any time before it.
create or replace function public.cancel_booking(p_booking_id uuid, p_reason text default null)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found or auth.uid() not in (b.student_id, b.teacher_id) then
    raise exception 'booking_not_found' using errcode = '42501';
  end if;
  if b.status <> 'scheduled' then raise exception 'booking_not_scheduled' using errcode = '22023'; end if;
  if b.starts_at <= now() then raise exception 'booking_started' using errcode = '22023'; end if;
  if auth.uid() = b.student_id and b.starts_at < now() + interval '6 hours' then
    raise exception 'cancellation_window_passed' using errcode = '22023';
  end if;
  update public.bookings
     set status = 'cancelled', cancelled_by = auth.uid(), cancelled_at = now(), cancel_reason = nullif(trim(p_reason), '')
   where id = p_booking_id
  returning * into b;
  return b;
end;
$$;
grant execute on function public.cancel_booking(uuid, text) to authenticated;

create or replace function public.reschedule_booking(p_booking_id uuid, p_new_start timestamptz)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  old public.bookings;
  nb public.bookings;
begin
  select * into old from public.bookings where id = p_booking_id;
  if not found or old.student_id <> auth.uid() then
    raise exception 'booking_not_found' using errcode = '42501';
  end if;
  perform public.cancel_booking(p_booking_id, 'rescheduled');
  nb := public.book_session(old.teacher_id, p_new_start, old.duration_min, old.is_trial);
  update public.bookings set rescheduled_from = old.id where id = nb.id returning * into nb;
  return nb;
end;
$$;
grant execute on function public.reschedule_booking(uuid, timestamptz) to authenticated;

-- Busy intervals of teachers (no student details) for slot generation.
create or replace function public.teacher_busy(p_teacher_ids uuid[], p_from timestamptz, p_to timestamptz)
returns table (teacher_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.teacher_id, b.starts_at, b.ends_at from public.bookings b
  where b.teacher_id = any (p_teacher_ids) and b.status in ('scheduled', 'completed')
    and b.starts_at < p_to and b.ends_at > p_from
  union all
  select e.teacher_id, e.starts_at, e.ends_at from public.availability_exceptions e
  where e.teacher_id = any (p_teacher_ids) and e.starts_at < p_to and e.ends_at > p_from;
$$;
grant execute on function public.teacher_busy(uuid[], timestamptz, timestamptz) to authenticated;

-- Session progress -----------------------------------------------------------------------

create or replace function public.on_session_progress() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
begin
  if tg_op = 'UPDATE' and old.status = 'approved' and not public.is_admin() then
    raise exception 'session_progress_locked' using errcode = '42501';
  end if;
  select * into b from public.bookings where id = new.booking_id;
  if b.status = 'cancelled' then raise exception 'booking_cancelled' using errcode = '22023'; end if;
  new.teacher_id := b.teacher_id;
  new.student_id := b.student_id;
  new.program_id := b.program_id;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status = 'draft') then
    new.approved_at := now();
    update public.bookings set status = 'completed' where id = b.id and status = 'scheduled';
  end if;
  return new;
end;
$$;
create trigger session_progress_rules before insert or update on public.session_progress
for each row execute function public.on_session_progress();

-- Distinct mushaf pages covered by approved sessions of a program.
create or replace function public.program_pages_covered(p_program_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(distinct pg)::int
  from public.session_progress sp, generate_series(sp.from_page::int, sp.to_page::int) pg
  where sp.program_id = p_program_id and sp.status = 'approved';
$$;
grant execute on function public.program_pages_covered(uuid) to authenticated;

-- Ijazahs ---------------------------------------------------------------------------------

-- Verification code: MJZ-XXXX-XXXC, unambiguous alphabet, last char is a checksum.
-- Mirrors src/lib/verificationCode.ts.
create or replace function public.verification_checksum(body text)
returns text language plpgsql immutable as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  s int := 0;
  i int;
begin
  for i in 1 .. char_length(body) loop
    s := s + i * (strpos(alphabet, substr(body, i, 1)) - 1);
  end loop;
  return substr(alphabet, (s % 32) + 1, 1);
end;
$$;

create or replace function public.generate_verification_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(7);
  body text := '';
  i int;
begin
  for i in 0 .. 6 loop
    body := body || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return 'MJZ-' || substr(body, 1, 4) || '-' || substr(body, 5, 3) || public.verification_checksum(body);
end;
$$;

create or replace function public.issue_ijazah(p_program_id uuid)
returns public.ijazahs
language plpgsql security definer set search_path = public as $$
declare
  prog public.ijazah_programs;
  t public.profiles;
  s public.profiles;
  covered int;
  sessions int;
  code text;
  result public.ijazahs;
begin
  select * into prog from public.ijazah_programs where id = p_program_id for update;
  if not found or prog.teacher_id <> auth.uid() then
    raise exception 'program_not_found' using errcode = '42501';
  end if;
  if prog.status <> 'active' then raise exception 'program_not_active' using errcode = '22023'; end if;
  covered := public.program_pages_covered(p_program_id);
  if covered < 604 then raise exception 'khatmah_incomplete' using errcode = '22023'; end if;
  select * into t from public.profiles where id = prog.teacher_id;
  select * into s from public.profiles where id = prog.student_id;
  if t.teacher_status <> 'approved' or coalesce(t.sanad_text, '') = '' then
    raise exception 'teacher_not_verified' using errcode = '42501';
  end if;
  select count(*) into sessions from public.session_progress where program_id = p_program_id and status = 'approved';

  loop
    code := public.generate_verification_code();
    exit when not exists (select 1 from public.ijazahs where verification_code = code);
  end loop;

  insert into public.ijazahs (program_id, student_id, teacher_id, riwayah, student_name, teacher_name,
                              sanad_snapshot, granting_sheikh_snapshot, pages_count, sessions_count,
                              started_at, verification_code)
  values (prog.id, prog.student_id, prog.teacher_id, prog.riwayah, s.full_name, t.full_name,
          t.sanad_text, t.granting_sheikh, covered, sessions, prog.started_at, code)
  returning * into result;

  update public.ijazah_programs set status = 'completed', completed_at = now() where id = prog.id;
  perform set_config('mujaz.trusted', 'on', true);
  update public.profiles set ijazahs_granted = ijazahs_granted + 1 where id = prog.teacher_id;
  perform set_config('mujaz.trusted', 'off', true);
  return result;
end;
$$;
grant execute on function public.issue_ijazah(uuid) to authenticated;

-- Issued ijazahs are immutable; only an admin may revoke (set revoke fields once).
create or replace function public.guard_ijazah() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  if not public.is_admin() and current_setting('mujaz.trusted', true) is distinct from 'on' then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  if (to_jsonb(new) - array['revoked_at', 'revoked_by', 'revoke_reason', 'student_id', 'teacher_id'])
     is distinct from (to_jsonb(old) - array['revoked_at', 'revoked_by', 'revoke_reason', 'student_id', 'teacher_id']) then
    raise exception 'ijazahs_are_immutable' using errcode = '42501';
  end if;
  if old.revoked_at is not null then
    raise exception 'ijazah_already_revoked' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger ijazahs_guard before update or delete on public.ijazahs
for each row execute function public.guard_ijazah();

create or replace function public.revoke_ijazah(p_id uuid, p_reason text)
returns public.ijazahs
language plpgsql security definer set search_path = public as $$
declare
  result public.ijazahs;
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'revoke_needs_reason' using errcode = '22023'; end if;
  update public.ijazahs set revoked_at = now(), revoked_by = auth.uid(), revoke_reason = trim(p_reason)
   where id = p_id returning * into result;
  if not found then raise exception 'ijazah_not_found' using errcode = '22023'; end if;
  return result;
end;
$$;
grant execute on function public.revoke_ijazah(uuid, text) to authenticated;

-- Public verification: anyone with the code sees only the certificate's public fields.
create or replace function public.verify_ijazah(p_code text)
returns table (
  verification_code text, student_name text, teacher_name text, riwayah text,
  riwayah_name_ar text, riwayah_name_en text, sanad_snapshot text, granting_sheikh_snapshot text,
  pages_count smallint, sessions_count int, started_at timestamptz, issued_at timestamptz,
  revoked boolean, revoke_reason text
)
language sql stable security definer set search_path = public as $$
  select i.verification_code, i.student_name, i.teacher_name, i.riwayah, r.name_ar, r.name_en,
         i.sanad_snapshot, i.granting_sheikh_snapshot, i.pages_count, i.sessions_count, i.started_at,
         i.issued_at, i.revoked_at is not null, i.revoke_reason
  from public.ijazahs i join public.riwayat r on r.code = i.riwayah
  where i.verification_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
$$;
grant execute on function public.verify_ijazah(text) to anon, authenticated;

-- Reviews ------------------------------------------------------------------------------------

create or replace function public.on_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
begin
  if tg_op = 'INSERT' then
    select * into b from public.bookings where id = new.booking_id;
    if b.student_id is distinct from auth.uid() and current_setting('mujaz.trusted', true) is distinct from 'on' then
      raise exception 'not_your_booking' using errcode = '42501';
    end if;
    if b.status <> 'completed' then raise exception 'booking_not_completed' using errcode = '22023'; end if;
    new.student_id := b.student_id;
    new.teacher_id := b.teacher_id;
  end if;
  return new;
end;
$$;
create trigger reviews_rules before insert on public.reviews
for each row execute function public.on_review();

create or replace function public.refresh_teacher_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tid uuid := coalesce(new.teacher_id, old.teacher_id);
begin
  perform set_config('mujaz.trusted', 'on', true);
  update public.profiles p
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where teacher_id = tid), 0),
         rating_count = (select count(*) from public.reviews where teacher_id = tid)
   where p.id = tid;
  perform set_config('mujaz.trusted', 'off', true);
  return null;
end;
$$;
create trigger reviews_aggregate after insert or update or delete on public.reviews
for each row execute function public.refresh_teacher_rating();

create view public.public_reviews with (security_invoker = false) as
  select rv.id, rv.teacher_id, rv.rating, rv.tags, rv.comment, rv.created_at,
         split_part(p.full_name, ' ', 1) || coalesce(' ' || nullif(left(split_part(p.full_name, ' ', 2), 1), '') || '.', '') as reviewer_name
  from public.reviews rv
  left join public.profiles p on p.id = rv.student_id
  join public.profiles t on t.id = rv.teacher_id and t.teacher_status = 'approved';
grant select on public.public_reviews to anon, authenticated;

-- Row level security ---------------------------------------------------------------------------

alter table public.teacher_applications enable row level security;
alter table public.teacher_riwayat enable row level security;
alter table public.teacher_documents enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.ijazah_programs enable row level security;
alter table public.bookings enable row level security;
alter table public.session_progress enable row level security;
alter table public.recitation_mistakes enable row level security;
alter table public.ijazahs enable row level security;
alter table public.reviews enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.is_approved_teacher(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_id and role = 'teacher' and teacher_status = 'approved');
$$;

-- profiles: teachers can read the profiles of students who booked them.
create policy "teachers read their students" on public.profiles for select using (
  exists (select 1 from public.bookings b where b.teacher_id = auth.uid() and b.student_id = profiles.id)
);

-- teacher_applications
create policy "teacher reads own applications" on public.teacher_applications
  for select using (teacher_id = auth.uid());
create policy "teacher creates draft" on public.teacher_applications
  for insert with check (
    teacher_id = auth.uid() and status = 'draft'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );
create policy "teacher edits own draft" on public.teacher_applications
  for update using (teacher_id = auth.uid() and status = 'draft')
  with check (teacher_id = auth.uid() and status in ('draft', 'pending')
              and reviewed_by is null and rejection_reason is null);
create policy "teacher deletes own draft" on public.teacher_applications
  for delete using (teacher_id = auth.uid() and status = 'draft');
create policy "admins read applications" on public.teacher_applications
  for select using (public.is_admin());

-- teacher_riwayat: public for approved teachers; written only by review_teacher_application.
create policy "riwayat of approved teachers are public" on public.teacher_riwayat
  for select using (public.is_approved_teacher(teacher_id) or teacher_id = auth.uid() or public.is_admin());

-- teacher_documents: owner (while draft) and admins only.
create policy "owner reads documents" on public.teacher_documents
  for select using (teacher_id = auth.uid());
create policy "admins read documents" on public.teacher_documents
  for select using (public.is_admin());
create policy "owner adds documents to draft" on public.teacher_documents
  for insert with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.teacher_applications a
                where a.id = application_id and a.teacher_id = auth.uid() and a.status = 'draft')
  );
create policy "owner removes documents from draft" on public.teacher_documents
  for delete using (
    teacher_id = auth.uid()
    and exists (select 1 from public.teacher_applications a
                where a.id = application_id and a.status = 'draft')
  );

-- availability
create policy "availability of approved teachers is readable" on public.availability_rules
  for select using (public.is_approved_teacher(teacher_id) or teacher_id = auth.uid());
create policy "teacher manages own availability" on public.availability_rules
  for all using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid()
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));
create policy "exceptions are readable by owner" on public.availability_exceptions
  for select using (teacher_id = auth.uid());
create policy "teacher manages own exceptions" on public.availability_exceptions
  for all using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid()
              and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- programs
create policy "participants read programs" on public.ijazah_programs
  for select using (student_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());

-- bookings: read by participants; all writes go through RPCs.
create policy "participants read bookings" on public.bookings
  for select using (student_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());

-- session progress
create policy "teacher reads own session records" on public.session_progress
  for select using (teacher_id = auth.uid());
create policy "student reads approved records" on public.session_progress
  for select using (student_id = auth.uid() and status = 'approved');
create policy "admins read session records" on public.session_progress
  for select using (public.is_admin());
create policy "teacher records own sessions" on public.session_progress
  for insert with check (
    exists (select 1 from public.bookings b where b.id = booking_id and b.teacher_id = auth.uid())
  );
create policy "teacher edits draft records" on public.session_progress
  for update using (teacher_id = auth.uid() and status = 'draft') with check (teacher_id = auth.uid());

-- mistakes (live during the session; locked once the record is approved)
create policy "participants read mistakes" on public.recitation_mistakes
  for select using (student_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());
create policy "teacher adds mistakes" on public.recitation_mistakes
  for insert with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.bookings b
                where b.id = booking_id and b.teacher_id = auth.uid() and b.student_id = recitation_mistakes.student_id
                  and b.status in ('scheduled', 'completed'))
    and not exists (select 1 from public.session_progress sp where sp.booking_id = recitation_mistakes.booking_id and sp.status = 'approved')
  );
create policy "teacher removes mistakes before approval" on public.recitation_mistakes
  for delete using (
    teacher_id = auth.uid()
    and not exists (select 1 from public.session_progress sp where sp.booking_id = recitation_mistakes.booking_id and sp.status = 'approved')
  );

-- ijazahs
create policy "holder and granter read ijazahs" on public.ijazahs
  for select using (student_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());

-- reviews
create policy "students review own completed bookings" on public.reviews
  for insert with check (
    exists (select 1 from public.bookings b where b.id = booking_id and b.student_id = auth.uid() and b.status = 'completed')
  );
create policy "own reviews readable" on public.reviews
  for select using (student_id = auth.uid() or teacher_id = auth.uid() or public.is_admin());

-- push tokens
create policy "own push tokens" on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage: private bucket for certificate uploads, path = <teacher_id>/<application_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-documents', 'teacher-documents', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "teachers upload own documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'teacher-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner and admins read documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'teacher-documents'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "owner deletes own documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'teacher-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime: the student sees mistakes appear during the live session.
alter publication supabase_realtime add table public.recitation_mistakes;
