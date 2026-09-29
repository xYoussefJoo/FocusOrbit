# 005 — Our own auth, real tracking, and a front door

**Date:** 2026-09-25
**Files:** `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`, `src/proxy.ts`,
`src/data/{auth,tasks,history,run-action}.ts`, `src/app/actions/tracking.ts`, `src/app/(auth)/*`,
`src/components/{auth,workspace}/*`, `src/app/page.tsx`, `drizzle/0001_better_auth.sql`

## 1. Auth: from Clerk to Better Auth

### The decision
| | Hosted (Clerk) | **Self-hosted library (Better Auth) ✓** |
|---|---|---|
| Where users live | Clerk's servers | **Our Postgres** |
| Setup | Keys from a dashboard | Tables + a secret |
| What you learn | How to call an auth API | **How auth actually works** |
| Cost of mistakes | They handle hashing, sessions | We own it (tests prove it) |

Chosen for learning and ownership. Clerk was also our biggest blocker: without keys nothing loaded.

### How it works (the part worth remembering)
```
Sign up  → users row + auth_accounts row (provider "credential", password = scrypt HASH)
         → auth_sessions row with a random token → token sent as an httpOnly cookie
Request  → cookie → look up auth_sessions by token → not expired? → that's the user
Sign out → delete the auth_sessions row + clear the cookie
```
- **One users table.** Better Auth's `user` model is mapped onto *our* `users` table, so tasks and sessions keep pointing at one id.
  Its other tables are prefixed `auth_` so they don't collide with our focus `sessions`.
- **Two gates.** `proxy.ts` does a *fast optimistic* check (does a session cookie exist?) and redirects to `/sign-in`.
  The *real* check (valid, unexpired session in the DB) happens in the workspace page and in every Server Action (`runAction`).
- **Open-redirect protection.** `/sign-in?next=//evil.com` would bounce users off-site after login; `safeNext` only allows same-site paths.
- **Timezone at sign-up.** The browser sends its IANA timezone; a database hook validates it (invalid → UTC) so date queries can't break.
- **Sign-out reloads the page**, which wipes all in-memory state, so the next person on that browser never sees your data.

### The migration we had to hand-edit
`drizzle-kit` generated `ADD COLUMN "email" text NOT NULL`, which fails on existing rows. Fixed with the classic pattern:
add the column nullable → backfill → `SET NOT NULL`. **Read every migration before applying it.**

## 2. Tracking: the timer now knows *what* the time was for
- **Setup → Focus → Wrap-up.** Pick a task and topic (a task's topic is pre-filled), focus, then write what you learned and optionally mark the task done.
- **Time's up pauses instead of ending**, so the wrap-up can still capture your reflection. The wrap-up state is *derived* ("paused with 0 left"), not stored.
- **Tasks:** todo → in progress (starting a session on it) → done (wrap-up or checkbox). Starting never downgrades a finished task.
- **History** is calculated, not stored: finished sessions grouped by *local* day using `AT TIME ZONE`.
- **Streak** = consecutive local days with a completed session; today still "alive" if you haven't studied yet. Pure function, unit-tested across month/year boundaries.
- **One round trip:** `getTrackingAction` returns tasks, topics, today and history together; a `trackingVersion` counter in the store triggers a reload after any change.

## 3. The front door
A Vesper landing page with a workspace preview drawn in HTML using the real tokens, "one session, three steps", honest features
only (no invented stats or testimonials), and split-screen sign-in / sign-up pages.

## Cleanup
Clerk, the legacy `/focus-orbit` route, `IdeWorkspace` and four unused components were removed. All legacy color aliases are now
deleted, and ESLint is clean across the whole project for the first time.

## Verified
- `npm test`: **32 tests**, including Better Auth on our real tables (hashed password, wrong password rejected, duplicate email rejected).
- `tsc` and ESLint clean; `next build` ✓.
- **End to end in a real (headless) browser:** sign in → pick a task (topic auto-filled) → start → *reload the page, the timer keeps running* →
  wrap up with a reflection + mark done → the database shows `completed` / `done`, and the session is at the top of History.

## Demo account
`npm run db:seed` → **demo@vesper.dev / vesper-demo-123** (local only), with four days of history.
