# State of the tree

Snapshot of `main` at commit `2226a14` (`Add inline editing for participant calories and macros in current week`), reviewed 14 October 2026.

This file lists the routes, scripts, and the table and bucket names the code uses.

## Application

`package.json` name `omrhub-website`, version `0.1.0`, `private: true`.

Next.js `14.2.3` App Router, React `18.3.1`, TypeScript `5.4.5` with `strict: true`. Root layout title is `OMR‑HUB` (`app/layout.tsx`). `components/AppLayout.tsx` wraps public pages with `Navigation` and `Footer`. Paths under `/admin` except `/admin/login` skip that chrome.

Dependencies used by the UI and API: `@supabase/ssr`, `@supabase/supabase-js`, `marked`, `quill`, `react-quill`, `react-markdown`, `remark-breaks`, `recharts`, `turndown`.

## Scripts and config

| File | What it sets |
| --- | --- |
| `package.json` scripts | `dev` = `next dev`, `build` = `next build`, `start` = `next start`, `lint` = `next lint` |
| `next.config.mjs` | `reactStrictMode: true` only |
| `vercel.json` | `framework: nextjs`, `buildCommand: npm run build`, `outputDirectory: .next` |
| `tsconfig.json` | `@/*` maps to `./*` |
| `.gitignore` | `node_modules`, `.env.local`, `.next`, `.DS_Store` |

No `engines` field, no `.nvmrc`, no ESLint config file, no test script, no CI workflow, no `.env.example`, no SQL migrations.

Next.js `14.2.3` in `package-lock.json` requires Node `>=18.17.0`. `npm run dev` does not set a port; Next.js 14 uses 3000 when `PORT` is unset.

## Environment

| Variable | Readers |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts` |

The two `lib` clients fall back to `https://qunbglfspdhzlmkrdqxc.supabase.co` and a hardcoded anon key. Middleware does not. Missing env vars there skip the admin check after a console error.

## Auth

1. Browser login: `app/admin/(auth)/login/page.tsx` calls `signInWithPassword`, then selects `roles.is_admin`. Admins are routed to `/admin/users`.
2. Page gate: `middleware.ts` for `/admin` except `/admin/login` and except `/api/*`. Requires a session user with `roles.is_admin`. Failure redirects to `/admin/login?redirect=<path>`.
3. API gate: `app/api/admin/**` handlers call `requireAdmin()` in `lib/auth.ts`, which redirects to `/admin/login` when the user is missing or not an admin.
4. `components/admin/AdminLayoutWrapper.tsx` also checks the client session and `roles.is_admin` before showing admin pages.
5. Public nav swaps the admin link to `/admin/users` with label `Admin Portal` when `roles.is_admin` is true (`components/Navigation.tsx`).

`GET /api/pricing-packages` and `POST /api/discount-codes/validate` do not call `requireAdmin()`.

## Public routes

| Path | File | Behavior in code |
| --- | --- | --- |
| `/` | `app/page.tsx` | Marketing page. Mailto for coaches is `OMRHub@acesapps.com`. Download link is `/get-app`. |
| `/features` | `app/features/page.tsx` | Feature list. Several entries use a `Coming soon` badge. |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy. Page says last updated December 16, 2025. |
| `/terms` | `app/terms/page.tsx` | Terms. Page says last updated December 16, 2025. |
| `/support` | `app/support/page.tsx` | FAQ. Support mailto is `OMRHub@acesapps.com`. |
| `/order` | `app/order/page.tsx` | Loads packages for `circuits`, `pt`, or `joint_pt`. Purchase button calls `alert`. |
| `/get-app` | `app/get-app/route.ts` | 302 to App Store `id6755069825` (iOS and fallback) or Play Store `com.omrhub.app` (Android). |
| `/events/create` | `app/events/create/page.tsx` | Posts to `/api/admin/events` and the event image upload route. |
| `/events/[id]` | `app/events/[id]/page.tsx` | Fetches `/api/admin/activities/[id]`. |
| `/schedule/create` | `app/schedule/create/page.tsx` | Renders `components/ScheduleCreate.tsx`, which posts to `/api/admin/activities` and loads `/api/admin/users`. |
| `/schedule/[id]` | `app/schedule/[id]/page.tsx` | Fetches `/api/admin/activities/[id]`. |
| `/a/activities/[id]` | `app/a/activities/[id]/page.tsx` | `DeepLinkPage` type `activities`. Smart App Banner `app-id=6755069825`. |
| `/a/events/[id]` | `app/a/events/[id]/page.tsx` | `DeepLinkPage` type `events`. |
| `/a/workouts/[id]` | `app/a/workouts/[id]/page.tsx` | `DeepLinkPage` type `workouts`. |
| `/.well-known/apple-app-site-association` | `app/.well-known/apple-app-site-association/route.ts` | AASA JSON, `Content-Type: application/json`. |
| `/apple-app-site-association` | `app/apple-app-site-association/route.ts` | Same AASA body, plus `Cache-Control: public, max-age=3600`. |

AASA body: `applinks.details[0].appID` = `S7NY9U87TZ.com.omrhub.app`, `paths` = `['/a/*']`.

`DeepLinkPage` builds `https://omrhub.acesapps.com/a/{type}/{id}` and links to the same App Store URL as `/get-app`.

There is no `app/events/page.tsx` and no `app/schedule/page.tsx`.

## Admin pages

Rendered nav (`components/admin/TopNavigation.tsx`):

| Label | Path |
| --- | --- |
| Users | `/admin/users` |
| Challenges | `/admin/challenges` |
| Schedule | `/admin/schedule` |
| Events | `/admin/events` |
| Credits | `/admin/credits` |
| Workouts | `/admin/coach/workouts` |
| Exercises | `/admin/coach/exercises` |
| PT Schedule | `/admin/coach/schedule` |

Other admin pages in `app/admin/`:

- `/admin/login`
- `/admin/users/[id]`
- `/admin/challenges/create`, `/admin/challenges/[id]`, `/admin/challenges/[id]/edit`
- `/admin/challenges/[id]/participants`, `/admin/challenges/[id]/participants/[userId]` (enrollment calorie adjustment and macro percents, daily check-ins)
- `/admin/challenges/[id]/community/create`
- `/admin/challenges/[id]/timed/create`, `/admin/challenges/[id]/timed/[timedChallengeId]`, `.../edit`
- `/admin/schedule/create`, `/admin/schedule/[id]`, `/admin/schedule/[id]/edit`
- `/admin/events/create`, `/admin/events/[id]`
- `/admin/coach/schedule/create`, `/admin/coach/schedule/[id]`, `.../edit`
- `/admin/coach/workouts/create`, `/admin/coach/workouts/[id]`
- `/admin/coach/exercises/create`, `/admin/coach/exercises/[id]`

There is no admin page for discount codes. Discount code CRUD exists only as `/api/admin/discount-codes`.

`app/admin/layout.tsx` sets `dynamic = 'force-dynamic'` and does not check auth itself. The comment in that file says middleware and `AdminLayoutWrapper` do.

## API routes

All `app/api/admin/**` handlers call `requireAdmin()`.

| Prefix | Tables or storage the handlers name |
| --- | --- |
| `/api/admin/users`, `/api/admin/users/[id]` | `profiles`, `credits`, `pt_credits`, `joint_pt_credits`, `unlimited_subscriptions`, `activities`, `event_attendance`, `events`, `workouts`, `workout_assignments`, `community_challenge_submissions` |
| `/api/admin/users/profile-image` | storage bucket `avatars` |
| `/api/admin/activities`, `/api/admin/activities/[id]`, `.../attendees`, `.../messages` | `activities`, `activity_attendance`, `activity_messages`, `profiles` |
| `/api/admin/events`, `/api/admin/events/[id]`, `.../messages` | `events`, `event_attendance`, `event_day_attendance`, `event_messages`, `profiles` |
| `/api/admin/events/image`, `/api/admin/events/[id]/upload-image` | storage buckets, in order: `activity-images`, `images`, `event-images`, `avatars` (the `[id]` upload list uses those four; the image route also tries `activity-image`) |
| `/api/admin/schedule/circuit-attendance` | `activities`, `activity_attendance` |
| `/api/admin/coach/pt-schedule` | `activities`, `activity_attendance`, `profiles` |
| `/api/admin/workouts`, `/api/admin/workouts/[id]` | `workouts`, `workout_exercises` |
| `/api/admin/workout-assignments` | `workouts`, `workout_exercises`, `workout_assignments` |
| `/api/admin/exercises`, `/api/admin/exercises/[id]` | `exercises` |
| `/api/admin/exercises/upload-video`, `.../video-url` | storage bucket `exercise-videos` |
| `/api/admin/credits` | `credit_transactions` (circuits), `pt_credit_transactions` (`type=pt`), `joint_pt_credit_transactions` (`type=partner-pt`); joined to `profiles` and `activities` |
| `/api/admin/challenges`, `/api/admin/challenges/[id]` | `challenges`, `challenge_enrollments`, `challenge_goals`, `community_challenges` |
| `/api/admin/challenges/upload-image` | storage bucket `challenges` |
| `/api/admin/challenges/[id]/goals` | `challenge_goals` |
| `/api/admin/challenges/[id]/enrollments` | `challenge_enrollments`, `profiles`, `challenges` |
| `/api/admin/challenges/[id]/participants/...` | `challenge_enrollments`, `challenge_goals`, `challenge_daily_checkins`, `challenge_red_days`, `challenge_weight_measurement_checkins`, `challenge_physique_checkins`, `challenge_weekly_checkins`, `challenge_enrollment_history`, `challenge_weekly_workout_schedules`, `profiles` |
| `/api/admin/challenges/[id]/workout-templates` | `challenge_workout_templates` |
| `/api/admin/challenges/[id]/timed` and `.../timed-api` | `community_challenges`, `community_challenge_submissions` |
| `/api/admin/discount-codes` | `discount_codes` |
| `/api/admin/bulk-template` | `bulk_creation_templates` |
| `/api/pricing-packages` | `pricing_packages` (`credit_type` `circuits`, `pt`, or `joint_pt`; `is_active` true) |
| `/api/discount-codes/validate` | `discount_codes` |

## Copy that differs from the admin routes

`app/page.tsx`, `app/features/page.tsx`, and `app/support/page.tsx` label coach communities, a personal training space, programs, and challenges as coming soon. The admin app already has challenge pages and the challenge APIs above, including community/timed challenges and participant check-ins.

`/events/[id]` and `/schedule/[id]` are outside `/admin`, and they call `/api/admin/activities/[id]`, which calls `requireAdmin()`.

The event image upload error text tells the reader to create a bucket named `activity-image`. The upload attempts `activity-images` first.

## Files present that other source files do not import

Confirmed by search for imports:

- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminNavigation.tsx`
- `components/admin/AdminHeader.tsx`
- `components/admin/SecondarySidebar.tsx`
- `components/admin/ChallengesSidebar.tsx`
- `components/admin/SubNavigation.tsx`
- `components/admin/ChallengeList.tsx`
- `components/admin/CommunityChallengeList.tsx`
- `components/DiscountCodeInputMobile.tsx`

`components/admin/CommunityChallengeForm.tsx` exports `TimedChallengeForm`.

Tracked files the TypeScript sources do not reference:

- `8 Week Oct 5.xlsx` at the repository root
- `app/.DS_Store` (`.gitignore` lists `.DS_Store`; this copy is already tracked)
