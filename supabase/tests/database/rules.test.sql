-- Database rule tests. Run: npx supabase test db   (requires the seed data)
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- helpers --------------------------------------------------------------------------
create or replace function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;
create or replace function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- A bookable slot: the next Sunday 19:00 Cairo time that is 2–7 days away (teacher 101 works 18–22).
create temp table slot as
select ((d::date + time '19:00') at time zone 'Africa/Cairo') as starts_at
from generate_series((now() at time zone 'Africa/Cairo')::date + 2, (now() at time zone 'Africa/Cairo')::date + 8, interval '1 day') d
where extract(dow from d) = 0
limit 1;
grant select on slot to authenticated, anon;

-- 1. booking succeeds for a matched student ------------------------------------------
select pg_temp.act_as('00000000-0000-4000-a000-000000000203'); -- Yusuf
select lives_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at from slot), 30, true) $$,
  'student books a free slot (trial)'
);

-- 2. the same slot cannot be booked twice (exclusion constraint) -----------------------
select pg_temp.act_as('00000000-0000-4000-a000-000000000201'); -- Ahmad
select throws_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at from slot), 30) $$,
  '23P01', 'slot_taken', 'double booking the teacher is rejected'
);

-- 3. overlapping 60-minute booking starting 30 minutes earlier is also rejected
select throws_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at - interval '30 minutes' from slot), 60) $$,
  '23P01', 'slot_taken', 'overlapping booking is rejected'
);

-- 4. a second free trial with the same teacher is rejected
select pg_temp.act_as('00000000-0000-4000-a000-000000000203');
select throws_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at + interval '1 hour' from slot), 30, true) $$,
  '23505', 'trial_already_used', 'only one free trial per student–teacher pair'
);

-- 5. slots outside availability are rejected
select throws_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at - interval '12 hours' from slot), 30) $$,
  '22023', 'slot_unavailable', 'booking outside the teacher''s hours is rejected'
);

-- 6. direct inserts into bookings are blocked by RLS (no insert policy)
select throws_ok(
  $$ insert into public.bookings (student_id, teacher_id, starts_at, ends_at, duration_min)
     values ('00000000-0000-4000-a000-000000000203', '00000000-0000-4000-a000-000000000102',
             now() + interval '3 days', now() + interval '3 days 30 minutes', 30) $$,
  '42501', null, 'clients cannot insert bookings directly'
);

-- 7. gender matching: a female student with "female teachers only" can't book a male teacher
select pg_temp.act_as('00000000-0000-4000-a000-000000000202'); -- Sara
select throws_ok(
  $$ select public.book_session('00000000-0000-4000-a000-000000000101', (select starts_at + interval '2 hours' from slot), 30) $$,
  '42501', 'teacher_not_matched', 'female-only students cannot book male teachers'
);

-- 8. …and only sees female teachers in the directory
select is(
  (select count(*) from public.list_teachers() where gender <> 'female'), 0::bigint,
  'female-only students see female teachers only'
);

-- 9. a male student does not see a teacher who teaches women only
select pg_temp.act_as('00000000-0000-4000-a000-000000000201');
select is(
  (select count(*) from public.list_teachers() where id = '00000000-0000-4000-a000-000000000102'), 0::bigint,
  'teacher''s "who I teach" setting is respected'
);

-- 10. students see only their own bookings
select pg_temp.act_as('00000000-0000-4000-a000-000000000202');
select is(
  (select count(*) from public.bookings where student_id = '00000000-0000-4000-a000-000000000201'), 0::bigint,
  'a student cannot read another student''s bookings'
);

-- 11. a teacher sees only their own students' progress
select pg_temp.act_as('00000000-0000-4000-a000-000000000102');
select is(
  (select count(*) from public.session_progress), 0::bigint,
  'a teacher cannot read other teachers'' session records'
);

-- 12. users cannot promote themselves
select pg_temp.act_as('00000000-0000-4000-a000-000000000201');
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-4000-a000-000000000201' $$,
  '42501', 'role cannot be changed', 'students cannot change their role'
);

-- 13. ijazahs are immutable even for their teacher
select pg_temp.act_as('00000000-0000-4000-a000-000000000103');
select lives_ok($$ update public.ijazahs set student_name = 'x' $$, 'teacher update runs');
select is(
  (select student_name from public.ijazahs limit 1), 'يوسف خالد الأنصاري',
  'teachers cannot change an issued ijazah (no update policy)'
);

-- 14. admins can revoke (with a reason) — once
select pg_temp.act_as('00000000-0000-4000-a000-000000000001');
select lives_ok(
  $$ select public.revoke_ijazah((select id from public.ijazahs limit 1), 'test revoke') $$,
  'admin revokes an ijazah with a reason'
);

-- 15. public verification works signed out
select pg_temp.act_as_anon();
select is(
  (select count(*) from public.verify_ijazah('mjz-k7qd-xp22')), 1::bigint,
  'anyone can verify an ijazah by code (case-insensitive)'
);

-- 16. …but cannot read the ijazahs table
select is((select count(*) from public.ijazahs), 0::bigint, 'anon cannot list ijazahs');
select is((select revoked from public.verify_ijazah('MJZ-K7QD-XP22')), true, 'verification shows the revocation');

-- 19–22. issuing an ijazah --------------------------------------------------------
reset role;
select set_config('mujaz.trusted', 'on', true);
insert into public.bookings (id, student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, price)
values ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000101',
        '00000000-0000-4000-b000-000000000001', now() - interval '3 hours', now() - interval '150 minutes', 30, 'scheduled', 12);
select set_config('mujaz.trusted', 'off', true);

select pg_temp.act_as('00000000-0000-4000-a000-000000000101');
select throws_ok(
  $$ select public.issue_ijazah('00000000-0000-4000-b000-000000000001') $$,
  '22023', 'khatmah_incomplete', 'cannot issue before all 604 pages are recorded'
);
insert into public.session_progress (booking_id, from_page, to_page, quality, status)
values ('00000000-0000-4000-e000-000000000001', 200, 604, 'excellent', 'approved');
select is(
  (select pages_count from public.issue_ijazah('00000000-0000-4000-b000-000000000001')), 604::smallint,
  'teacher issues the ijazah at 604/604'
);
select throws_ok(
  $$ select public.issue_ijazah('00000000-0000-4000-b000-000000000001') $$,
  '22023', 'program_not_active', 'an ijazah is issued only once per program'
);
select ok(
  (select verification_code ~ '^MJZ-[A-Z2-9]{4}-[A-Z2-9]{4}$' and sanad_snapshot like '%المرصفي%'
   from public.ijazahs where program_id = '00000000-0000-4000-b000-000000000001'),
  'code is well-formed and the sanad was snapshotted'
);

select * from finish();
rollback;
