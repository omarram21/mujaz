# Mujaz · مُجاز

Mobile app (iOS and Android) that connects students with verified Quran teachers who hold an Ijazah with sanad. Students book one-to-one live sessions, the app tracks the recitation of the whole mushaf page by page (1–604), and the sheikh issues a digital Ijazah that anyone can verify by code or QR.

Arabic is the default language (full RTL); English is the second language.

| | |
|---|---|
| App | Expo SDK 57 · React Native · TypeScript (strict) · Expo Router |
| Backend | Supabase: Auth, Postgres + RLS, Storage, Realtime, Edge Functions |
| Calls | Daily.co (`@daily-co/react-native-daily-js`), behind `src/services/calls.tsx` |
| State | TanStack Query (server) · Zustand (local) |
| Forms | react-hook-form + zod |
| i18n | i18next + expo-localization |

> **Why SDK 57 and not 58?** Daily's Expo config plugin (`@daily-co/config-plugin-rn-daily-js@0.0.13`) supports `expo >=55 <58`. Move to SDK 58 when Daily publishes a compatible plugin.

---

## 1. Prerequisites

- Node 20 or 22 LTS (Node 25 works for development, but Expo tests against LTS)
- Docker (for the local Supabase stack)
- An Expo account (`npx eas-cli@latest login`) for device builds
- A physical device or emulator. **Expo Go cannot run this app**, because Daily needs native code. Use a development build (see section 5).

## 2. Install

```bash
npm install
cp .env.example .env     # then fill in the values (see section 4)
```

## 3. Supabase

### Local (recommended for development)

```bash
npm run db:start         # = npx supabase start   (API on http://127.0.0.1:54421)
npm run db:reset         # applies supabase/migrations/* and supabase/seed.sql
npx supabase status      # prints the anon key to put in .env
npm run db:types         # regenerates src/lib/database.types.ts after schema changes
npx supabase test db     # runs the pgTAP tests in supabase/tests
```

The local ports are shifted (544xx) so the stack doesn't collide with other Supabase projects on the machine. Studio runs at http://127.0.0.1:54423 and the mail catcher at http://127.0.0.1:54424.

Phones reach the local API through your computer's LAN IP. Set `EXPO_PUBLIC_SUPABASE_URL=http://<your-lan-ip>:54421` in `.env` when you test on a device.

### Hosted project

1. Create a project at https://supabase.com, then **Project Settings → API**: copy the URL and the anon key into `.env`.
2. Link the project and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push            # applies supabase/migrations
   ```
   Don't run `seed.sql` against production. It creates demo accounts.
3. **Auth → URL configuration**: add `mujaz://**` as a redirect URL.
4. **Auth → Providers**:
   - Email: on. Turn on "Confirm email" for production; the app already handles the "check your email" case.
   - Phone (optional): needs an SMS provider (Twilio, MessageBird or Vonage). Then set `EXPO_PUBLIC_ENABLE_PHONE_AUTH=true`.
   - Google (optional): the button is behind `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH`. Wiring the native sign-in is a `TODO(google-auth)` in `src/features/auth/components/AltSignIn.tsx`.
5. Deploy the Edge Functions and set the Daily secret:
   ```bash
   npx supabase functions deploy create-daily-room
   npx supabase functions deploy delete-account
   npx supabase secrets set DAILY_API_KEY=<your Daily API key>
   ```
6. Create the first admin. Sign up in the app, then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

### Seed accounts (local only, password `Password123!`)

| Role | Email |
|---|---|
| Admin | `admin@mujaz.test` |
| Teachers (approved) | `abdulrahman@` · `umm.anas@` · `yasir@` · `fatima@` · `alamin@` (all `@mujaz.test`) |
| Applicant (pending) | `hamza@mujaz.test` |
| Students | `ahmad@` (khatmah in progress, 205/604) · `sara@` (female, female teachers only) · `yusuf@` (holds an Ijazah) |

Issued Ijazah to try on the verify screen: **`MJZ-K7QD-XP22`**.

## 4. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Supabase API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Supabase anon (public) key |
| `EXPO_PUBLIC_ENABLE_PHONE_AUTH` | `.env` | `true` once an SMS provider is configured |
| `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH` | `.env` | `true` once Google sign-in is wired |
| `EXPO_PUBLIC_VERIFY_BASE_URL` | `.env` | Base of the verification link printed in QR codes |
| `APP_BUNDLE_ID` | `.env` / EAS | iOS bundle id and Android package (default `com.mujaz.app`) |
| `EAS_PROJECT_ID` | `.env` / EAS | Set after `eas init`; enables push tokens and EAS Update |
| `DAILY_API_KEY` | **Supabase secret only** | Used by the `create-daily-room` function; never shipped in the app |

`.env` is git-ignored. For local Edge Functions, put `DAILY_API_KEY=...` in `supabase/functions/.env` and run `npx supabase functions serve --env-file supabase/functions/.env`.

## 5. Running on a device (development build)

```bash
npx eas-cli@latest init                               # once; puts the project id in EAS
npx eas-cli@latest build --profile development --platform android   # or ios
# install the build on the device, then:
npm start                                             # expo start --dev-client
```

With Android Studio or Xcode installed you can build locally instead: `npm run android` / `npm run ios`.

`npm run web` starts a web build. It's useful for checking screens quickly, but live calls and the QR scanner only work on devices.

## 6. Release builds (App Store and Google Play)

1. Replace the placeholders: `APP_BUNDLE_ID`, the icons in `assets/images/` (generated from the logo; swap for final artwork), and `ascAppId` in `eas.json`.
2. Set the secrets in EAS (`eas env:create`) for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `APP_BUNDLE_ID` and `EAS_PROJECT_ID`.
3. Build and submit:
   ```bash
   npx eas-cli@latest build --profile production --platform all
   npx eas-cli@latest submit --profile production --platform ios
   npx eas-cli@latest submit --profile production --platform android
   ```
4. Store requirements already handled: in-app **account deletion** (Account → Delete account), camera and microphone permission texts in Arabic and English (`locales/*.json`, `app.config.ts`), and `ITSAppUsesNonExemptEncryption=false`.
5. Before submitting, fill in the support email (`TODO(support)`) and the terms/privacy URLs (`TODO(legal)`).

## 7. Project layout

```
app/                      Expo Router routes (thin wrappers around feature screens)
  (auth)/                 welcome, sign-up, sign-in, profile-setup
  (student)/              tabs: teachers, sessions, progress, account; teacher/[id], book/[teacherId],
                          session/[bookingId] (live), rate/[bookingId], ijazah/[id], my-ijazahs
  (teacher)/              tabs: dashboard, schedule, students, account; apply, availability,
                          live/[bookingId], session-notes/[bookingId], student/[programId], teacher-ijazah/[id]
  (admin)/applications    pending applications and review
  verify/                 public verification (index and [code] deep link), reachable signed out
src/
  components/             design-system components (Text, Button, Card, Chip, headers, states, icons…)
  features/<area>/        screens, components and data hooks per feature
  services/               supabase client, calls (Daily), notifications
  lib/                    pure logic: slots, matching, progress, verification codes, dates, formatNumber, quran
  theme/                  colour tokens (light + dark), typography, spacing
  i18n/                   ar.json (default), en.json
supabase/
  migrations/             schema, RLS, RPCs, triggers
  functions/              create-daily-room, delete-account
  tests/database/         pgTAP tests
  seed.sql                demo data
design/project/           the 18 reference screens (HTML)
```

## 8. Key rules and where they're enforced

| Rule | Where |
|---|---|
| Only approved teachers are visible; private columns hidden | `public_teachers` view, `list_teachers()` |
| Female students see female teachers only by default; each teacher's "who I teach" is respected | `teacher_matches()` (SQL) = `src/lib/matching.ts`; enforced again in `book_session()` |
| No double booking for a teacher or a student | `EXCLUDE USING gist` constraints on `bookings` |
| One free 30-minute trial per student–teacher pair | partial unique index on `bookings` |
| Students cancel or reschedule until 6 hours before the start; join opens 10 minutes before | `cancel_booking()`; `canJoin()`; `create-daily-room` |
| Ijazah only at 604/604, issued once, immutable, sanad snapshotted, admin-only revoke | `issue_ijazah()`, `guard_ijazah()` trigger, `revoke_ijazah()` |
| Certificate files readable only by the owner and admins | storage policies on `teacher-documents` |
| Users can't change their own role, status or ratings | `guard_profile_columns()` trigger |

## 9. Checks

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint (also flags hard-coded UI text)
npm test                 # jest unit tests
npx supabase test db     # pgTAP database tests
npm run check            # typecheck + lint + jest
```

The unit tests cover slot generation across time zones (DST, half-hour offsets), the overlap rule behind double-booking prevention, khatmah progress, verification code generation and validation, gender matching, booking windows, number formatting and translation completeness. The database tests cover double booking, trials, availability, RLS isolation, role escalation, Ijazah immutability, issuing and revocation, and public verification.

## 10. Not in v1

Payments and payouts (prices are shown and stored per booking; see `TODO(payments)` in `book_session()` and the booking screen), session recording, group classes, chat, a web app, and AI recitation feedback.

**Payments:** Stripe isn't available to businesses in Jordan. Evaluate **HyperPay, PayTabs or Tap**.

## Credits

Quran metadata (surahs, ayah counts, Madani pages, juz boundaries) is generated from the [Tanzil](https://tanzil.net) metadata file (CC BY 3.0) by `scripts/generate-quran-meta.mjs`. The app contains no Quran text.
