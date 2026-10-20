-- Phase 8: gender snapshots on ijazahs (for correct Arabic wording on the certificate)
-- and reviews allowed as soon as the session has started.

alter table public.ijazahs
  add column student_gender public.gender,
  add column teacher_gender public.gender;

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
                              student_gender, teacher_gender, sanad_snapshot, granting_sheikh_snapshot,
                              pages_count, sessions_count, started_at, verification_code)
  values (prog.id, prog.student_id, prog.teacher_id, prog.riwayah, s.full_name, t.full_name,
          s.gender, t.gender, t.sanad_text, t.granting_sheikh, covered, sessions, prog.started_at, code)
  returning * into result;

  update public.ijazah_programs set status = 'completed', completed_at = now() where id = prog.id;
  perform set_config('mujaz.trusted', 'on', true);
  update public.profiles set ijazahs_granted = ijazahs_granted + 1 where id = prog.teacher_id;
  perform set_config('mujaz.trusted', 'off', true);
  return result;
end;
$$;

-- Public verification also returns the snapshot genders (wording only; no other personal data).
drop function if exists public.verify_ijazah(text);
create function public.verify_ijazah(p_code text)
returns table (
  verification_code text, student_name text, teacher_name text, riwayah text,
  riwayah_name_ar text, riwayah_name_en text, sanad_snapshot text, granting_sheikh_snapshot text,
  pages_count smallint, sessions_count int, started_at timestamptz, issued_at timestamptz,
  revoked boolean, revoke_reason text, student_gender public.gender, teacher_gender public.gender
)
language sql stable security definer set search_path = public as $$
  select i.verification_code, i.student_name, i.teacher_name, i.riwayah, r.name_ar, r.name_en,
         i.sanad_snapshot, i.granting_sheikh_snapshot, i.pages_count, i.sessions_count, i.started_at,
         i.issued_at, i.revoked_at is not null, i.revoke_reason, i.student_gender, i.teacher_gender
  from public.ijazahs i join public.riwayat r on r.code = i.riwayah
  where i.verification_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
$$;
grant execute on function public.verify_ijazah(text) to anon, authenticated;

-- Reviews: a student may rate a session once it has started (not only after the record).
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
    if b.status = 'cancelled' or b.starts_at > now() then
      raise exception 'booking_not_reviewable' using errcode = '22023';
    end if;
    new.student_id := b.student_id;
    new.teacher_id := b.teacher_id;
  end if;
  return new;
end;
$$;

drop policy if exists "students review own completed bookings" on public.reviews;
create policy "students review own past bookings" on public.reviews
  for insert with check (
    exists (select 1 from public.bookings b
            where b.id = booking_id and b.student_id = auth.uid()
              and b.status <> 'cancelled' and b.starts_at <= now())
  );
