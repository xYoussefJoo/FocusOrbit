# 003 — The session engine

**Date:** 2026-09-25
**Files:** `src/lib/session-clock.ts`, `src/data/sessions.ts`, `src/data/auth.ts`,
`src/app/actions/sessions.ts`, `src/hooks/useFocusSession.ts`, `src/components/focus-orbit/FocusTimer.tsx`,
`src/store/useFocusStore.ts`, `src/proxy.ts`

## The problem
The old timer was a number in a Zustand store, decremented by `setInterval` inside the IDE component.
It drifted in background tabs, died when you switched views, vanished on refresh, and saved nothing.

## The shape of the solution: three layers

```
Browser                     Server                                   Database
───────                     ──────                                   ────────
FocusTimer  ─┐
useFocusSession ── calls ─▶ 'use server' actions ── userId ─▶ DAL ── SQL ─▶ focus_sessions
Zustand store ◀─ SessionDTO + serverNow ─┘  (auth check)      (ownership,   (now(), constraints)
                                                               transitions)
session-clock.ts  ◀────────── shared pure math ──────────────▶
```

| Layer | Job | Why it's separate |
|---|---|---|
| `session-clock.ts` | Pure math: focused / remaining / progress from timestamps | No I/O → trivially testable, shared by server & browser |
| `data/sessions.ts` (DAL, `server-only`) | Every DB read/write, scoped by `userId` | One place for authorization; can never be bundled to the browser |
| `app/actions/sessions.ts` (`'use server'`) | Check who's calling, delegate, return a small result | Actions are public POST endpoints: thin, easy to audit |
| `useFocusSession` + `FocusTimer` | Call actions, render the clock | UI logic stays out of the data layer |

## Decisions and why

### 1. Timestamps, not countdowns
The DB stores `focused_seconds` (banked) + `last_resumed_at`. The browser computes
`focused = banked + (now − lastResumedAt)` on every render. Nothing is decremented, so nothing can drift,
and unmounting a component loses nothing: the truth lives in the database.

### 2. One clock: the database's
Every transition uses Postgres `now()`. Actions also return `serverNow` (read from the DB), and the browser
stores `offset = serverNow − Date.now()`. If your laptop clock is 40 s fast, the timer is still right.
We read it from the DB rather than Node because Docker's clock lives in the WSL VM, which can drift after sleep.

### 3. Every transition is one guarded UPDATE
```sql
UPDATE focus_sessions
SET status = 'paused', focused_seconds = focused_seconds + <stretch>, last_resumed_at = NULL
WHERE id = $1 AND user_id = $2 AND status = 'running'
RETURNING *;
```
No "read, check, then write" (two tabs could both pass the check). The `WHERE` *is* the check, and it's atomic.
Zero rows returned ⇒ invalid transition.

### 4. Auth in the action, ownership in the DAL
Next.js docs: *Server Actions are reachable via direct POST requests* — every action calls `requireUserId()`.
The DAL puts `user_id = $userId` in every query and verifies that a client-supplied `topicId`/`taskId` belongs
to the caller. That blocks **IDOR** (Insecure Direct Object Reference): guessing someone else's id does nothing.

### 5. Validate everything from the client
`plannedSeconds` must be an integer between 60 and 14 400; ids must be UUIDs; reflections ≤ 2000 chars.
Parameterized SQL already prevents injection. Validation gives clear errors instead of DB exceptions.

### 6. Return only what the UI needs
Actions return a `SessionDTO` (no `userId`, no internals) wrapped in `{ ok, session, serverNow }` or
`{ ok: false, code, error }`. Unexpected errors are logged on the server, and the browser gets a generic message.

### 7. `middleware.ts` → `proxy.ts`
Next.js 16 deprecated the `middleware` file name. Same Clerk code, new name, and the build shows `ƒ Proxy`.

## Testing
`npm test` runs Node's built-in test runner through `tsx`:
- **Unit** (`session-clock.test.ts`): math, drift-proofing, clamping, formatting.
- **Integration** (`sessions.test.ts`), against the real Docker DB: lifecycle, one-active rule, invalid transitions,
  cross-user attacks, input validation. Time is simulated by *rewinding* `last_resumed_at`, so tests are instant and exact.

Trick: `--conditions=react-server` makes `import 'server-only'` resolve to an empty module, so the DAL is testable
outside Next.js without weakening the protection inside it.

Result: **13/13 passing**, `tsc` clean, `next build` ✓.

## Try it
`npm run dev` → sign in → Orbit IDE → start a 25m session. Then:
refresh the page (it continues) · switch to Dashboard and back (it continues) · pause in one tab, then focus another
tab (it syncs) · `npm run db:studio` to watch the row change.
