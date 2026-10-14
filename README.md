# OMR-HUB website

Next.js site for OMR-HUB (`package.json` name `omrhub-website`). It serves the public pages, Universal Link pages, the `/get-app` store redirect, the `/order` credit packages page, and the admin portal.

The route and data inventory is in [docs/STATE.md](docs/STATE.md). Notes for people changing this repo are in [AGENTS.md](AGENTS.md).

This file describes the tree on `main` at commit `2226a14`.

## Stack

- Next.js `14.2.3` (App Router), React `18.3.1`, TypeScript `5.4.5`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for auth and data
- `vercel.json` sets `framework` to `nextjs`, `buildCommand` to `npm run build`, and `outputDirectory` to `.next`

`next.config.mjs` enables `reactStrictMode` and sets no other options. TypeScript is `strict`, and `@/*` maps to the repository root.

## Setup

Next.js `14.2.3` declares `engines.node` of `>=18.17.0` in `package-lock.json`. This repository has no `engines` field and no `.nvmrc`.

```bash
npm ci
```

`package-lock.json` is the lockfile for that install.

### Environment

`.gitignore` ignores `.env.local`. There is no `.env.example` in the repository.

| Variable | Where it is read |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts`, `lib/supabase-server.ts`, `middleware.ts` |

`lib/supabase.ts` and `lib/supabase-server.ts` fall back to the Supabase project URL `https://qunbglfspdhzlmkrdqxc.supabase.co` and a hardcoded anon key when those variables are unset. `middleware.ts` does not use that fallback. If either variable is missing, middleware logs `Missing Supabase environment variables` and continues the request without creating a Supabase client, so the admin session check in middleware does not run.

This repository has no SQL migrations. Tables and storage buckets are the ones named in the route handlers; see [docs/STATE.md](docs/STATE.md).

## Run

Scripts from `package.json`:

| Script | Command |
| --- | --- |
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `next lint` |

`npm run dev` does not pass a port. Next.js 14 uses port 3000 when `PORT` is unset.

`npm run start` serves the output of `next build`.

`npm run lint` runs `next lint`. The repository has `eslint` and `eslint-config-next` in `devDependencies` and no ESLint config file (no `.eslintrc.*` or `eslint.config.*`).

## What the site serves

Public navigation (`components/Navigation.tsx`) links to `/`, `/features`, `/#coaches`, `/get-app`, and either `/admin/login` or `/admin/users` when the signed-in user has `roles.is_admin`. The footer links to `/privacy`, `/terms`, and `/support`.

`/get-app` returns a 302. iOS user agents go to the App Store listing `id6755069825`. Android user agents go to the Play Store listing `com.omrhub.app`. Other user agents go to the App Store listing.

`/a/activities/[id]`, `/a/events/[id]`, and `/a/workouts/[id]` render `components/DeepLinkPage.tsx`. Apple App Site Association JSON is served at `/.well-known/apple-app-site-association` and `/apple-app-site-association` for app ID `S7NY9U87TZ.com.omrhub.app` and paths `/a/*`. The page hardcodes the Universal Link host `https://omrhub.acesapps.com`.

`/order` loads active rows from `pricing_packages` and can validate a code through `POST /api/discount-codes/validate`. The purchase button shows a browser alert. The click handler comment says the purchase flow (Stripe and similar) is still to be implemented.

Admin pages under `/admin`, except `/admin/login`, are gated in `middleware.ts` when both Supabase environment variables are set. The check reads `roles.is_admin`. The rendered admin navigation is `components/admin/TopNavigation.tsx`.

Support and coach mailto links use `OMRHub@acesapps.com`.
