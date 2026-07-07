Add a second top-level user track ("Girls") alongside the existing Pregnant Women track. Users pick a track when they create an account; the choice persists on their profile and drives the rest of the app. After signup, a short onboarding walkthrough explains how to use the app. Girls-track users get a separate content set with clinical tables locked down by RLS.

## 1. Data model

Add a `track` field to `profiles`:

- New enum `app_track` = `'pregnant' | 'girls'`.
- `profiles.track app_track` (nullable until the user picks; NOT NULL enforced in app flow).
- `profiles.onboarded boolean not null default false`.

Update RLS so Girls-track users cannot write to clinical tables:

- `pregnancies`, `vitals_readings`, `danger_sign_logs`: keep existing `auth.uid() = user_id`, AND require the caller's profile `track = 'pregnant'` (via a `SECURITY DEFINER` helper `public.user_track(uid uuid) returns app_track`).
- Girls-track reads/writes only touch new tables (below), never the pregnancy clinical tables.

New tables for Girls track (all with GRANTs + RLS):

- `girls_content` (public read): `slug`, `topic` (`puberty | menstrual | reproductive`), `language` (`fr|en|pcm|ff`), `title`, `body_md`, `order`. `GRANT SELECT ... TO anon, authenticated`.
- `claim_checks_girls` (owner-only): `user_id`, `claim_text`, `verdict`, `explanation`, `confident`. Same shape as existing pregnancy claim-check corpus but tagged for adolescent/reproductive-health myths.
- `help_resources` (public read): `country`, `region`, `category` (`abuse | mental_health | reproductive | general`), `name`, `phone`, `url`, `notes`, `language`.
- Explicitly NO per-user log of what Get Help pages were viewed — do not add a table for it.

Seed a small starter set of `girls_content` and `help_resources` rows in the same migration so the modules render immediately.

## 2. Signup / track selection

- After signup or first sign-in, if `profile.track` is null → redirect to a new route `/_authenticated/onboarding` that:
  1. Asks "Which describes you?" → **Pregnant Women** or **Girls / Young Women** (with short descriptions).
  2. Saves `track` to `profiles`.
  3. Shows a 3-step "How to use this app" walkthrough tailored to the chosen track (what each section does, offline note, "not a substitute for a health worker").
  4. Sets `onboarded = true`, then routes to `/pregnancy` (pregnant track) or `/girls` (girls track).
- Add a router-level check in `_authenticated/route.tsx`: after auth, fetch the profile once; if `track` is null or `onboarded` is false, redirect to `/onboarding` (except when already there).

## 3. Girls track routes

New routes under `_authenticated/`:

- `/girls` — landing/hub with three cards: Learn, Check a Claim, Get Help. Also a "How to use this app" replay link.
- `/girls/learn` — list of topics grouped by `puberty | menstrual | reproductive`, filtered by preferred language. Clicking opens the article (rendered from `body_md`). Browsable library, NOT a chat.
- `/girls/check` — single input; submits to existing claim-check server fn but with a new `corpus: 'girls'` parameter so it queries `claim_checks_girls` / the adolescent myths corpus. Same abstention UX: on low confidence, show "I'm not sure — please talk to a health worker" and do not guess.
- `/girls/help` — static-ish list from `help_resources` filtered by language/region. Prominent banner: "This is not a replacement for talking to a trusted adult or health worker." Every card links outward (tel:, https://). No view logging.

Pregnant track routes stay under `/pregnancy` and `/dashboard` unchanged.

## 4. Home page routing

`src/routes/index.tsx`:

- If signed in and `track = 'girls'` → primary CTA "Open Girls hub" → `/girls`.
- If signed in and `track = 'pregnant'` → keep "Start tracking" → `/pregnancy`.
- If signed out → "Start tracking" → `/auth?next=/onboarding` so new users hit track selection first.

Add a short "Two tracks" section on the landing page explaining both.

## 5. Server functions

New in `src/lib/`:

- `profile.functions.ts`: `getMyProfile`, `setTrack({ track })`, `setOnboarded()` — all with `requireSupabaseAuth`.
- `girls-content.functions.ts`: `listGirlsContent({ language, topic })`, `getGirlsArticle({ slug })` — publishable-key server client (public read).
- `girls-claim.functions.ts`: `checkGirlsClaim({ text })` — reuses the same claim-check logic as pregnancy but with `corpus: 'girls'`; enforces caller `track = 'girls'` via `requireSupabaseAuth`.
- `help-resources.functions.ts`: `listHelpResources({ language })` — public read.

## 6. i18n

All new content queries filter by `profile.preferred_language` (existing `app_language` enum: fr/en/pcm/ff). Seed content in French + English at minimum; add Pidgin/Fulfulde placeholders for the top articles so the language switcher works end to end.

## 7. Files to add / change

Add:

- `src/routes/_authenticated/onboarding.tsx`
- `src/routes/_authenticated/girls.tsx` (hub, uses `<Outlet />` if children, or flat)
- `src/routes/_authenticated/girls.learn.tsx`
- `src/routes/_authenticated/girls.learn.$slug.tsx`
- `src/routes/_authenticated/girls.check.tsx`
- `src/routes/_authenticated/girls.help.tsx`
- `src/lib/profile.functions.ts`
- `src/lib/girls-content.functions.ts`
- `src/lib/girls-claim.functions.ts`
- `src/lib/help-resources.functions.ts`
- `src/components/onboarding/TrackPicker.tsx`
- `src/components/onboarding/HowToUse.tsx`

Change:

- `src/routes/_authenticated/route.tsx` — add profile fetch + onboarding redirect.
- `src/routes/index.tsx` — track-aware CTA.
- Migration for enum + columns + tables + RLS + seed data.

## Open question

Final naming: **"Girls"** or **"Young Women"** for the second track label shown to users? The database enum value will be `girls` either way. Default to **"Girls & Young Women"** in the UI unless you say otherwise.
