-- Demo data for local development. All accounts use the password: Password123!
-- Runs as the database owner after migrations (`npx supabase db reset`).

select set_config('mujaz.trusted', 'on', false);

-- Fixed ids keep the seed reproducible.
-- admin            00000000-0000-4000-a000-000000000001
-- teachers         00000000-0000-4000-a000-0000000001xx
-- students         00000000-0000-4000-a000-0000000002xx
-- pending applicant 00000000-0000-4000-a000-000000000301

create or replace function pg_temp.seed_user(p_id uuid, p_email text, p_name text, p_role text)
returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          crypt('Password123!', gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('full_name', p_name, 'role', p_role, 'locale', 'ar'),
          now() - interval '400 days', now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end;
$$;

select pg_temp.seed_user('00000000-0000-4000-a000-000000000001', 'admin@mujaz.test', 'فريق مُجاز', 'student');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000101', 'abdulrahman@mujaz.test', 'الشيخ عبدالرحمن الحسيني', 'teacher');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000102', 'umm.anas@mujaz.test', 'الشيخة أم أنس القحطاني', 'teacher');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000103', 'yasir@mujaz.test', 'الشيخ ياسر البغدادي', 'teacher');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000104', 'fatima@mujaz.test', 'الشيخة فاطمة بن علي', 'teacher');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000105', 'alamin@mujaz.test', 'الشيخ محمد الأمين الشنقيطي', 'teacher');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000201', 'ahmad@mujaz.test', 'أحمد طارق العبّادي', 'student');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000202', 'sara@mujaz.test', 'سارة محمود الزعبي', 'student');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000203', 'yusuf@mujaz.test', 'يوسف خالد الأنصاري', 'student');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000301', 'hamza@mujaz.test', 'الشيخ حمزة العثماني', 'teacher');

-- Profiles ------------------------------------------------------------------------------

update public.profiles set role = 'admin', gender = 'male', country = 'JO', timezone = 'Asia/Amman', onboarded = true
 where id = '00000000-0000-4000-a000-000000000001';

update public.profiles p set
  gender = v.gender::public.gender, country = v.country, timezone = v.tz, teaches = v.teaches::public.teaches_gender,
  headline = v.headline, bio = v.bio, years_experience = v.years, price_30 = v.p30, price_60 = v.p60,
  teacher_status = 'approved', onboarded = true, granting_sheikh = v.granting, sanad_text = v.sanad
from (values
  ('00000000-0000-4000-a000-000000000101'::uuid, 'male', 'EG', 'Africa/Cairo', 'both',
   'خريج الأزهر · القاهرة، مصر',
   'مُجاز في رواية حفص وشعبة عن عاصم من طريق الشاطبية، يُقرئ منذ تسع سنوات.',
   9, 12, 22, 'الشيخ محمود الشحات أنور',
   'قرأ على الشيخ محمود الشحات أنور، عن الشيخ عبدالفتاح المرصفي، بسنده المتصل إلى رسول الله ﷺ.'),
  ('00000000-0000-4000-a000-000000000102'::uuid, 'female', 'SA', 'Asia/Riyadh', 'female',
   'للنساء والأطفال · الرياض، السعودية',
   'مُجازة في حفص وورش، متخصّصة في تعليم النساء والأطفال.',
   6, 10, 18, 'الشيخة رقية الشهري',
   'قرأت على الشيخة رقية الشهري، عن شيخها بسنده المتصل إلى رسول الله ﷺ.'),
  ('00000000-0000-4000-a000-000000000103'::uuid, 'male', 'JO', 'Asia/Amman', 'male',
   'القراءات العشر الصغرى · عمّان، الأردن',
   'مُجاز في القراءات العشر من طريقي الشاطبية والدرة.',
   15, 18, 32, 'الشيخ محمد تميم الزعبي',
   'قرأ القراءات العشر الصغرى على الشيخ محمد تميم الزعبي، بسنده المتصل إلى رسول الله ﷺ.'),
  ('00000000-0000-4000-a000-000000000104'::uuid, 'female', 'MA', 'Africa/Casablanca', 'both',
   'ورش وقالون · فاس، المغرب',
   'مُجازة في روايتي ورش وقالون عن نافع.',
   8, 9, 16, 'الشيخ عبدالهادي حميتو',
   'قرأت برواية ورش على الشيخ عبدالهادي حميتو، بسنده المتصل إلى رسول الله ﷺ.'),
  ('00000000-0000-4000-a000-000000000105'::uuid, 'male', 'MR', 'Africa/Nouakchott', 'both',
   'قالون والدوري · نواكشوط، موريتانيا',
   'من حملة القرآن في المحاضر الشنقيطية، مُجاز في قالون والدوري.',
   11, 8, 14, 'الشيخ محمد الحسن الددو',
   'أخذ رواية قالون في المحضرة على الشيخ محمد الحسن الددو، بسنده المتصل إلى رسول الله ﷺ.')
) as v(id, gender, country, tz, teaches, headline, bio, years, p30, p60, granting, sanad)
where p.id = v.id;

update public.profiles p set
  gender = v.gender::public.gender, country = v.country, timezone = v.tz, goal = 'ijazah',
  preferred_riwayat = v.riwayat, female_teachers_only = v.female_only, onboarded = true
from (values
  ('00000000-0000-4000-a000-000000000201'::uuid, 'male', 'JO', 'Asia/Amman', array['hafs'], false),
  ('00000000-0000-4000-a000-000000000202'::uuid, 'female', 'AE', 'Asia/Dubai', array['hafs', 'warsh'], true),
  ('00000000-0000-4000-a000-000000000203'::uuid, 'male', 'GB', 'Europe/London', array['ten_minor', 'hafs'], false)
) as v(id, gender, country, tz, riwayat, female_only)
where p.id = v.id;

update public.profiles set gender = 'male', country = 'TR', timezone = 'Europe/Istanbul'
 where id = '00000000-0000-4000-a000-000000000301';

insert into public.teacher_riwayat (teacher_id, riwayah) values
  ('00000000-0000-4000-a000-000000000101', 'hafs'), ('00000000-0000-4000-a000-000000000101', 'shuba'),
  ('00000000-0000-4000-a000-000000000102', 'hafs'), ('00000000-0000-4000-a000-000000000102', 'warsh'),
  ('00000000-0000-4000-a000-000000000103', 'ten_minor'), ('00000000-0000-4000-a000-000000000103', 'hafs'),
  ('00000000-0000-4000-a000-000000000104', 'warsh'), ('00000000-0000-4000-a000-000000000104', 'qalun'),
  ('00000000-0000-4000-a000-000000000105', 'qalun'), ('00000000-0000-4000-a000-000000000105', 'duri');

-- Approved applications (history) and one pending applicant for the admin screen.
insert into public.teacher_applications (teacher_id, status, gender, country, teaches, riwayat, granting_sheikh, sanad_text,
                                         years_experience, price_30, price_60, submitted_at, reviewed_by, reviewed_at, checklist)
select p.id, 'approved', p.gender, p.country, p.teaches,
       (select array_agg(riwayah) from public.teacher_riwayat where teacher_id = p.id),
       p.granting_sheikh, p.sanad_text, p.years_experience, p.price_30, p.price_60,
       now() - interval '200 days', '00000000-0000-4000-a000-000000000001', now() - interval '197 days',
       '{"identity": true, "certificate": true, "sanad": true, "recitation": true}'
from public.profiles p where p.role = 'teacher' and p.teacher_status = 'approved';

insert into public.teacher_applications (teacher_id, status, gender, country, teaches, riwayat, granting_sheikh, sanad_text,
                                         years_experience, price_30, price_60, submitted_at)
values ('00000000-0000-4000-a000-000000000301', 'pending', 'male', 'TR', 'male', array['hafs', 'susi'],
        'الشيخ أيمن رشدي سويد',
        'قرأ القرآن كاملًا برواية حفص على الشيخ أيمن رشدي سويد، عن الشيخ عبدالعزيز عيون السود، بسنده المتصل إلى رسول الله ﷺ.',
        7, 11, 20, now() - interval '2 days');
update public.profiles set teacher_status = 'pending' where id = '00000000-0000-4000-a000-000000000301';

-- Availability (in each teacher's own zone). Weekdays: 0 = Sunday … 6 = Saturday.
insert into public.availability_rules (teacher_id, weekday, start_time, end_time, timezone)
select p.id, d, s, e, p.timezone
from public.profiles p
cross join lateral (values
  (0, time '18:00', time '22:00'), (1, time '18:00', time '22:00'), (2, time '09:00', time '11:00'),
  (2, time '18:00', time '22:00'), (3, time '18:00', time '22:00'), (4, time '18:00', time '22:00'),
  (6, time '10:00', time '13:00')
) as r(d, s, e)
where p.role = 'teacher' and p.teacher_status = 'approved';

insert into public.availability_exceptions (teacher_id, starts_at, ends_at, reason)
values ('00000000-0000-4000-a000-000000000101', date_trunc('day', now()) + interval '8 days',
        date_trunc('day', now()) + interval '11 days', 'سفر');

-- Ahmad: khatmah in progress with Sheikh Abdulrahman (205 of 604 pages over 48 sessions) ----------

insert into public.ijazah_programs (id, student_id, teacher_id, riwayah, started_at)
values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000201',
        '00000000-0000-4000-a000-000000000101', 'hafs', now() - interval '100 days');

insert into public.bookings (id, student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, is_trial, price)
select ('00000000-0000-4000-c000-' || lpad(i::text, 12, '0'))::uuid,
       '00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000101',
       '00000000-0000-4000-b000-000000000001',
       date_trunc('hour', now()) - make_interval(days => 2 * (49 - i)) - interval '1 day',
       date_trunc('hour', now()) - make_interval(days => 2 * (49 - i)) - interval '1 day' + interval '30 minutes',
       30, 'completed', i = 1, case when i = 1 then 0 else 12 end
from generate_series(1, 48) i;

insert into public.session_progress (booking_id, from_page, to_page, quality, note, status)
select ('00000000-0000-4000-c000-' || lpad(i::text, 12, '0'))::uuid,
       floor((i - 1) * 205.0 / 48)::int + 1, floor(i * 205.0 / 48)::int,
       (array['excellent', 'good', 'excellent', 'acceptable', 'good'])[1 + i % 5]::public.session_quality,
       case when i = 48 then 'راجع أحكام الإخفاء قبل الجلسة القادمة، والأداء عمومًا متقن ما شاء الله.' end,
       'approved'
from generate_series(1, 48) i;

-- Records were approved right after each session.
update public.session_progress sp set approved_at = b.ends_at, created_at = b.starts_at
from public.bookings b where b.id = sp.booking_id;

-- Surah/ayah columns from the page ranges are filled by the app; seed a few mistakes on recent sessions.
insert into public.recitation_mistakes (booking_id, teacher_id, student_id, type, surah, ayah, page, description)
values
  ('00000000-0000-4000-c000-000000000048', '00000000-0000-4000-a000-000000000101', '00000000-0000-4000-a000-000000000201', 'tajweed', 9, 41, 195, 'إخفاء ناقص عند «من بعد»'),
  ('00000000-0000-4000-c000-000000000048', '00000000-0000-4000-a000-000000000101', '00000000-0000-4000-a000-000000000201', 'hifz', 9, 52, 196, 'سقوط لفظ «من»'),
  ('00000000-0000-4000-c000-000000000047', '00000000-0000-4000-a000-000000000101', '00000000-0000-4000-a000-000000000201', 'harakah', 9, 12, 188, 'فتح بدل الكسر في «أئمة»'),
  ('00000000-0000-4000-c000-000000000047', '00000000-0000-4000-a000-000000000101', '00000000-0000-4000-a000-000000000201', 'waqf', 9, 19, 189, 'وقف قبيح ثم ابتداء');

-- Upcoming sessions (aligned to the half hour, inside the teacher's evening hours where possible).
insert into public.bookings (id, student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, price)
select ('00000000-0000-4000-c000-0000000001' || lpad(i::text, 2, '0'))::uuid,
       '00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000101',
       '00000000-0000-4000-b000-000000000001',
       date_trunc('hour', now()) + make_interval(hours => 4, days => d),
       date_trunc('hour', now()) + make_interval(hours => 4, days => d) + interval '30 minutes',
       30, 'scheduled', 12
from (values (1, 0), (2, 2), (3, 4)) as v(i, d);

-- Yesterday's session the sheikh hasn't recorded yet (shows as "awaiting record").
insert into public.bookings (id, student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, price)
values ('00000000-0000-4000-c000-000000000199', '00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000101',
        '00000000-0000-4000-b000-000000000001', date_trunc('hour', now()) - interval '20 hours',
        date_trunc('hour', now()) - interval '20 hours' + interval '30 minutes', 30, 'scheduled', 12);

-- One cancelled session for the "cancelled" tab.
insert into public.bookings (student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, price,
                             cancelled_by, cancelled_at, cancel_reason)
values ('00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000101', '00000000-0000-4000-b000-000000000001',
        date_trunc('hour', now()) - interval '5 days' + interval '30 minutes', date_trunc('hour', now()) - interval '5 days' + interval '60 minutes',
        30, 'cancelled', 12, '00000000-0000-4000-a000-000000000201', now() - interval '6 days', 'ظرف طارئ');

-- Yusuf: completed khatmah with Sheikh Yasir and an issued Ijazah ---------------------------------

insert into public.ijazah_programs (id, student_id, teacher_id, riwayah, started_at)
values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000203',
        '00000000-0000-4000-a000-000000000103', 'hafs', now() - interval '320 days');

insert into public.bookings (id, student_id, teacher_id, program_id, starts_at, ends_at, duration_min, status, price)
select ('00000000-0000-4000-d000-' || lpad(i::text, 12, '0'))::uuid,
       '00000000-0000-4000-a000-000000000203', '00000000-0000-4000-a000-000000000103',
       '00000000-0000-4000-b000-000000000002',
       date_trunc('hour', now()) - make_interval(days => 320 - 2 * i),
       date_trunc('hour', now()) - make_interval(days => 320 - 2 * i) + interval '60 minutes',
       60, 'completed', 32
from generate_series(1, 121) i;

insert into public.session_progress (booking_id, from_page, to_page, quality, status)
select ('00000000-0000-4000-d000-' || lpad(i::text, 12, '0'))::uuid,
       floor((i - 1) * 604.0 / 121)::int + 1, floor(i * 604.0 / 121)::int,
       (array['excellent', 'good', 'excellent'])[1 + i % 3]::public.session_quality, 'approved'
from generate_series(1, 121) i;

update public.session_progress sp set approved_at = b.ends_at, created_at = b.starts_at
from public.bookings b where b.id = sp.booking_id and sp.program_id = '00000000-0000-4000-b000-000000000002';

update public.ijazah_programs set status = 'completed', completed_at = now() - interval '76 days'
 where id = '00000000-0000-4000-b000-000000000002';

insert into public.ijazahs (program_id, student_id, teacher_id, riwayah, student_name, teacher_name, sanad_snapshot,
                            granting_sheikh_snapshot, pages_count, sessions_count, started_at, issued_at, verification_code)
select pr.id, pr.student_id, pr.teacher_id, pr.riwayah, s.full_name, t.full_name, t.sanad_text, t.granting_sheikh,
       public.program_pages_covered(pr.id), 121, pr.started_at, now() - interval '76 days',
       'MJZ-K7QD-XP2' || public.verification_checksum('K7QDXP2')
from public.ijazah_programs pr
join public.profiles s on s.id = pr.student_id
join public.profiles t on t.id = pr.teacher_id
where pr.id = '00000000-0000-4000-b000-000000000002';

update public.profiles set ijazahs_granted = 1 where id = '00000000-0000-4000-a000-000000000103';

-- Reviews ------------------------------------------------------------------------------------------

insert into public.reviews (booking_id, rating, tags, comment)
values
  ('00000000-0000-4000-c000-000000000040', 5, array['precise', 'clearNotes'], 'دقيق جدًا في التجويد ولا يمرّ على خطأ. أتممت عشرة أجزاء معه خلال أربعة أشهر.'),
  ('00000000-0000-4000-c000-000000000020', 4, array['patient'], 'صبور مع المبتدئين، والملاحظات بعد كل جلسة مفيدة جدًا.'),
  ('00000000-0000-4000-d000-000000000120', 5, array['precise', 'punctual'], 'أتممت الختمة معه، متقن وملتزم بالمواعيد.'),
  ('00000000-0000-4000-d000-000000000060', 5, array['clearVoice'], null);

select set_config('mujaz.trusted', 'off', false);
