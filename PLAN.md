# Mujaz / مُجاز — MVP implementation plan

Status: **all 9 phases built** (one commit per phase). See README.md for setup.

### Decisions taken while building (from your answers + defaults)

- Expo **SDK 57**, not 58: Daily's config plugin only supports `expo <58` today.
- Prices in **USD**; one **free 30-min trial** per student–teacher pair (DB-enforced).
- Ijazah can be issued only at **604/604** pages, by the teacher, once; it is immutable.
- Mistakes are recorded **by the teacher**, live during the call (students see them via Realtime) and on the record screen.
- A teacher changing their sanad after approval submits a **new application** for review; issued Ijazahs keep the sanad from issue time.
- Bundle id placeholder **`com.mujaz.app`**; phone/Google sign-in built but **hidden behind env flags** until credentials exist.
- Students can rate a session as soon as it has started (not only after the teacher records it), so the rate screen can follow the call.
- Deleting an account removes all personal data; issued Ijazahs stay verifiable (snapshots), with links cleared.
- Progress tile "days in a row" became **weeks in a row** (sessions are typically not daily); "expected finish" is projected from the last 60 days.
- Calls run on native only; the web build shows a notice (useful for screen review, not for sessions).


## 0. Ground rules

- Stack exactly as specified: Expo (latest stable SDK at build time) + TypeScript strict + Expo Router, Dev Client + EAS, Supabase, Daily.co, TanStack Query, Zustand, react-hook-form + zod, i18next + expo-localization, expo-notifications, date-fns + date-fns-tz.
- Arabic default, RTL forced at startup (`I18nManager.forceRTL` + reload when the language changes). English secondary. Every UI string lives in `src/i18n/{ar,en}.json`; an ESLint rule (`react-native/no-raw-text` style check) catches raw strings in JSX.
- Design tokens from the spec are the only source of colour / type / spacing. No new visual language.
- Each phase ends with: app boots (`expo start` + typecheck + lint + tests green), short summary to you, one git commit.
- Toolchain note: this machine has Node 25 (non-LTS). Expo officially targets LTS; I'll use it unless something breaks, and recommend Node 22 LTS (via `nvm`) if it does.

## 1. Folder layout

```
app/                         Expo Router routes (thin: compose feature screens)
  _layout.tsx                fonts, i18n, QueryClient, auth gate → redirects by role
  (auth)/welcome, sign-in, sign-up, profile-setup
  (student)/(tabs)/teachers, sessions, progress, account
  (student)/teacher/[id], book/[teacherId], session/[bookingId], rate/[bookingId], ijazah/[id]
  (teacher)/(tabs)/dashboard, schedule, students, account
  (teacher)/apply, availability, session-notes/[bookingId]
  (admin)/applications, applications/[id]
  verify/[code]              public; also verify/index for manual code entry
src/
  theme/                     colors (light + dark), typography, spacing, radii, shadows, useTheme()
  components/                Button, Card, Text, Input, Chip, Toggle, Avatar(initials), Badge,
                             StatTile, ProgressBar, ProgressRing, StepProgress, BottomBar,
                             DarkHeader, Screen, EmptyState, ErrorState, LoadingState, icons/*
  features/
    auth/ profile/ teachers/ applications/ availability/ booking/ sessions/
    live/ progress/ ijazah/ verify/ reviews/ account/ admin/
      (each: api.ts (queries/mutations), hooks, screens, components, schema.ts, logic.ts + tests)
  services/
    supabase.ts              client (SecureStore session persistence)
    calls.ts                 the ONLY file that imports Daily — interface CallService {join, leave, toggleMic, toggleCam, events}
    notifications.ts         permission, push token registration, local reminders
  lib/
    formatNumber.ts          Arabic-Indic digits by locale (used everywhere)
    dates.ts                 UTC ↔ user TZ helpers, Hijri formatting via Intl (islamic-umalqura)
    quran/                   quran-meta.json + helpers (page→surah/ayah, juz of page, etc.)
    slots.ts                 availability → bookable slots (pure, tested)
    matching.ts              gender-matching rule (pure, tested)
    progress.ts              khatmah percentage / juz status (pure, tested)
    verificationCode.ts      code generation/normalisation (pure, tested)
  i18n/                      i18next init, ar.json, en.json, RTL bootstrap
supabase/
  migrations/                ordered SQL files
  functions/                 Edge Functions (create-daily-room, delete-account, issue-ijazah, verify-ijazah)
  seed.sql
```

## 2. Design system (`src/theme/`) — Phase 1

- `colors.ts`: every token from the spec table, as `light` and `dark` objects with identical keys (dark values derived now, app ships light-only behind a flag). Two gold values: `gold` (on dark, `#D4AF5A`) and `goldOnLight` (`#C9A227`), plus `goldText`.
- `typography.ts`: font families (Amiri 400/700, IBM Plex Sans Arabic 300–700) via `@expo-google-fonts/*`, size scale 10…64, named variants (`display`, `quran`, `title`, `body`, `caption`, …). `Text` component picks family by variant + weight (RN can't synthesise weights for custom fonts).
- `spacing.ts`, `radii.ts`, `layout.ts` (button heights 52/50, min touch 44, bottom-bar padding 20–22).
- Icons: hand-written stroke SVG components (`react-native-svg`), stroke 1.8–2, `accessibilityLabel` required on icon-only buttons (enforced by the `IconButton` prop types).
- `Avatar`: initials in a rounded square, palette chosen by hashing user id.
- Geometric gold pattern + logo as SVG components.

## 3. Database (Supabase) — Phase 2

Enums: `user_role (student|teacher|admin)`, `gender (male|female)`, `application_status (pending|approved|rejected)`, `booking_status (scheduled|completed|cancelled|no_show)`, `riwayah` (text table, not enum, so new riwayat need no migration), `mistake_type (tajweed|hifz|harakah|waqf)`, `session_quality (excellent|very_good|good|needs_review)`, `learning_goal (ijazah|memorization|tajweed)`.

| Table | Key columns / notes |
|---|---|
| `profiles` | id = auth.users.id, role, full_name, gender, country, timezone, goal, preferred_riwayat[], locale, female_teachers_only (default true for females), teaches_gender (`male|female|both`, teachers), bio, price_30/price_60 + currency, years_experience, accepting_bookings, rating_avg/rating_count (maintained by trigger), deleted_at |
| `teacher_applications` | teacher_id, status, granting_sheikh, sanad_text, submitted_at, reviewed_by, reviewed_at, rejection_reason, checklist jsonb |
| `teacher_riwayat` | teacher_id, riwayah (PK pair) |
| `teacher_documents` | application_id, storage_path, file_name, mime, size |
| `availability_rules` | teacher_id, weekday, start_time, end_time, timezone (teacher's IANA tz, so DST is handled at slot-generation time) |
| `availability_exceptions` | teacher_id, starts_at, ends_at (UTC), reason — blocked ranges / days off |
| `bookings` | student_id, teacher_id, starts_at, ends_at (UTC), duration_min (30/60), status, is_trial, price, daily_room_name, cancelled_by/at/reason. **Exclusion constraint** `EXCLUDE USING gist (teacher_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status <> 'cancelled')` + the same for `student_id` (needs `btree_gist`). |
| `ijazah_programs` | student_id, teacher_id, riwayah, status (active|completed|abandoned), started_at; unique active program per student+teacher+riwayah |
| `session_progress` | booking_id (unique), program_id, from_page, to_page, from_surah/ayah, to_surah/ayah, quality, note, status (draft|approved) |
| `recitation_mistakes` | session_progress_id, type, surah, ayah, page, note |
| `ijazahs` | program_id, student_id, teacher_id, riwayah, student_name_snapshot, teacher_name_snapshot, **sanad_snapshot**, pages_count, sessions_count, issued_at, verification_code (unique), revoked_at, revoked_by, revoke_reason. Trigger blocks UPDATE/DELETE except admin revoke fields. |
| `reviews` | booking_id (unique), student_id, teacher_id, rating 1–5, quality_tags[], comment |
| `push_tokens` | user_id, token (unique), platform |

RLS (every table): students read/write only their own rows; teachers read their own students' bookings/progress via `bookings.teacher_id = auth.uid()`; approved teacher profiles + riwayat + approved sanad readable by anyone authenticated; `is_admin()` SECURITY DEFINER helper for admin policies. Storage bucket `teacher-documents` is private; policies allow owner + admin only. Public Ijazah verification goes through a SECURITY DEFINER RPC `verify_ijazah(code)` returning only the public fields (no table-wide anon read). Role changes only via admin/trigger — a user can't set their own role to `teacher`/`admin` (column-level check in an update policy + trigger).

Progress = distinct mushaf pages covered in approved `session_progress` rows of the program (1–604), computed in a view/RPC; juz status from `quran-meta.json` boundaries.

Quran metadata: `src/lib/quran/quran-meta.json` — 114 surahs (ar/en names, ayah count, Madani start page), 30 juz boundaries (start surah:ayah + page), and a page→first-ayah table for computing the "surah-ayah" line from page inputs. Generated once from a trusted public dataset (Tanzil metadata) by a script kept in `scripts/`, checked in, no Quran text.

`seed.sql`: 1 admin, 5 approved teachers (male/female, Hafs/Warsh/Qalun/Shu'bah/al-Duri, different countries/TZs), 3 students, weekly availability, one khatmah in progress (~205/604 pages to match the design), one issued Ijazah with a known verification code.

## 4. Phases

1. **Setup & foundation** — `create-expo-app` (TS), Router, ESLint/Prettier/strict TS, Jest + RNTL, theme + shared components, i18n + RTL + `formatNumber`, Supabase client, auth (email/password, phone OTP), role-aware routing gate, screens 1–3 (Welcome, Auth, Profile setup), `app.config.ts` skeleton, `.env.example`.
2. **Schema** — migrations, RLS, storage bucket + policies, triggers, seed, Quran metadata JSON, generated DB types (`supabase gen types`). SQL tests for double-booking + RLS via `supabase test db` (pgTAP) where practical.
3. **Teacher onboarding** — screen 14 (application, document upload to Storage), screen 17 (admin list + review, approve/reject with reason, approval flips role + publishes riwayat/sanad).
4. **Discovery** — screens 4–5: list with search + riwayah filter + gender matching rule, teacher profile with sanad card + reviews.
5. **Booking** — screen 15 (availability), screen 6 (slot generation in student TZ, booking via RPC that relies on the exclusion constraint), screen 7 (my sessions, cancel/reschedule), local reminders + push token registration. Prices displayed; `// TODO(payments)` at the booking confirm step (HyperPay / PayTabs / Tap note).
6. **Live sessions** — Edge Function `create-daily-room` (validates caller is a participant and within the join window; creates room + meeting token; API key in function secrets only), `calls.ts` service, screen 8 (join from 10 min before, mic/cam/end, timer, current position, live mistakes list — teacher adds mistakes, student sees them via Supabase Realtime).
7. **Progress** — programs, screen 16 (session recording: pages → computed surah-ayah, quality, mistakes, draft/approve), screen 9 (ring, juz grid, recent sessions), screen 13 (teacher dashboard).
8. **Ijazah** — issue via Edge Function / RPC (snapshots sanad, generates code), screen 11 (certificate view, QR via `react-native-qrcode-svg`, PDF via `expo-print` + `expo-sharing`), screen 12 (public verify by code/QR scan with `expo-camera`), screen 10 (rate session).
9. **Account & release** — screen 18 (settings, language switch, reminders toggle, female-only toggle, delete account via Edge Function that anonymises/deletes data + auth user), empty/error/loading audit on every screen, remaining unit tests, README, `eas.json` (development / preview / production profiles).

Unit tests (Jest, pure functions in `src/lib`): slot generation across timezones incl. DST boundaries, double-booking (pure overlap check + DB constraint test), progress percentage, verification code generate/normalise/lookup, gender matching both directions.

## 5. Things you'll need to do outside the code

| When | What |
|---|---|
| Phase 1 | Create a Supabase project (or install Docker for the local Supabase CLI stack) and give me URL + anon key in `.env` |
| Phase 1 | Supabase phone auth needs an SMS provider (Twilio / MessageBird / Vonage) — account + credentials in the Supabase dashboard |
| Phase 1 (optional) | Google OAuth client IDs (iOS, Android, Web) if Google sign-in is in v1 |
| Phase 6 | Daily.co account + API key, set as an Edge Function secret (`supabase secrets set DAILY_API_KEY=...`) |
| Phase 6+ | Expo account + `eas login`; a physical device or emulator for the dev client (Daily doesn't run in Expo Go) |
| Release | Apple Developer + Google Play Console accounts, final bundle id, icon/splash artwork |

## 6. Still open / needs you

- Daily.co API key → `npx supabase secrets set DAILY_API_KEY=...` (calls return `daily_not_configured` until then).
- Hosted Supabase project, EAS project, store accounts, final icons, support email, terms/privacy URLs.
- SMS provider (phone OTP) and Google OAuth client ids, then flip the env flags.
- Payments provider (HyperPay / PayTabs / Tap) — hook points marked `TODO(payments)`.
