# Agent notes

This repository is the OMR-HUB Next.js site (`omrhub-website`). Read [README.md](README.md) for setup and [docs/STATE.md](docs/STATE.md) for the route and data inventory. Those files describe commit `2226a14` on `main`. When they disagree with the code, follow the code and update the docs in the same change.

## Layout

- `app/` — App Router pages and route handlers. Admin UI is under `app/admin/`. Admin JSON handlers are under `app/api/admin/`.
- `components/` — UI. The admin chrome that `app/admin/layout.tsx` renders is `components/admin/AdminLayoutWrapper.tsx`, which mounts `components/admin/TopNavigation.tsx`.
- `lib/supabase.ts` — browser Supabase client (`createBrowserClient`).
- `lib/supabase-server.ts` — server Supabase client (`createServerClient` + `cookies()`).
- `lib/auth.ts` — `getCurrentUser()` and `requireAdmin()`.
- `middleware.ts` — admin page gate. Matcher skips `_next/static`, `_next/image`, `favicon.ico`, and common image extensions.
- `public/omr-logo-inverted.png` — logo used by the public nav and deep-link pages.

TypeScript path alias `@/*` points at the repository root (`tsconfig.json`).

## Auth

Admin page protection and admin API protection are separate.

- `middleware.ts` checks `/admin` paths other than `/admin/login`. It skips paths starting with `/api/`. When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set, it loads the session and requires `roles.is_admin` for that user. Otherwise it redirects to `/admin/login` with a `redirect` query param. If either env var is missing, middleware logs and does not perform that check.
- Handlers under `app/api/admin/` call `requireAdmin()` from `lib/auth.ts`. That helper redirects to `/admin/login` when there is no user, no `roles` row, or `is_admin` is false. It uses `redirect()`, so the response is a redirect, not a JSON 401.
- `GET /api/pricing-packages` and `POST /api/discount-codes/validate` do not call `requireAdmin()`.
- Login is `app/admin/(auth)/login/page.tsx`. It uses `supabase.auth.signInWithPassword`, then reads `roles.is_admin`. An admin session is sent to `/admin/users`.

`lib/supabase.ts` and `lib/supabase-server.ts` contain a hardcoded project URL and anon key used when the env vars are unset. Do not copy that key into docs or new files. Prefer the env vars.

## Data

There is no schema, seed, or migration directory in this repository. Query the table and bucket names already used in the route handlers. `docs/STATE.md` lists them. Do not invent tables.

Storage uploads name these buckets in code:

- `challenges` — challenge image upload
- `exercise-videos` — exercise video upload and signed URL
- `avatars` — profile image
- event image upload tries `activity-images`, then `images`, `event-images`, and `avatars`

## Working in this repo

- Use TypeScript. Keep the App Router file conventions already in `app/`.
- `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` are the only scripts. There is no test script and no ESLint config file in the tree.
- `package-lock.json` is the lockfile. Dependency changes belong with a lockfile update, and only when the task asks for them.
- Public marketing copy in `app/page.tsx`, `app/features/page.tsx`, and `app/support/page.tsx` still labels challenges, programs, coach communities, and a personal training space as coming soon. Admin challenge routes are already in `app/admin/challenges/` and `app/api/admin/challenges/`. Update both surfaces together when that copy changes.
- `components/admin/AdminSidebar.tsx` and `components/admin/AdminNavigation.tsx` are not imported. The live admin nav is `TopNavigation.tsx`.
- `/order` does not take payment. The purchase button calls `alert`.
- Deep-link pages hardcode `https://omrhub.acesapps.com`. AASA `appID` is `S7NY9U87TZ.com.omrhub.app`.
