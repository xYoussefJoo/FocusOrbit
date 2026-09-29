# 004 — Becoming Vesper: rebrand + one workspace

**Date:** 2026-09-25
**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/workspace/*`,
`src/components/focus-orbit/FocusTimer.tsx`, `src/app/workspace/*`
**Design canvas:** "FocusOrbit Rebrand Directions" (claude.ai artifact)

## The problem
FocusOrbit looked like many dashboards: bright green gradients, glows, uppercase labels everywhere.
The code had **two token systems fighting** (Material names like `--color-primary: #4edea3` and shadcn's
`--color-primary: var(--primary)` defining the *same variable*) plus ~120 hardcoded hex colors.
And the workspace rendered **two layouts on top of each other** (double sidebar, clipped labels).

## How we chose the brand
Three complete directions, each with a name, palette, type, logo mark and the *same* workspace screen,
so the comparison was about brand, not layout:

| | A · Lumen | B · Stillwater | **C · Vesper ✓** |
|---|---|---|---|
| Feel | Warm editorial dark | Light, Nordic, paper | Midnight precision |
| Accent | Ember `#E58A52` | Deep teal `#2E6B63` | **Signal amber `#F2B544`** |
| Type | Fraunces + Instrument Sans | Newsreader + Hanken Grotesk | **Sora + Manrope + JetBrains Mono** |

**Chosen: Vesper, "Evening focus, engineered."** An instrument panel after dark, for night-shift builders.

## Decisions and why

### 1. Tokens named by *role*, not by color
`canvas · panel · raised · line` (surfaces), `ink · ink-muted · ink-faint` (text), `signal` (the one accent).
Components write `bg-panel text-ink-muted`, never `#10131b`. Rebranding again = editing one file.
We avoided names like `primary`/`surface` because both old systems already used them.

### 2. One accent with one meaning
Amber means **"you are in session"**: the timer ring, the running pill, the active tab edge.
When everything is highlighted, nothing is.

### 3. Contrast was checked, not guessed
`ink` 15.9:1, `ink-muted` 6.3:1, `ink-faint` 4.7:1 on `panel`, all above WCAG AA (4.5:1) for body text.

### 4. Migrate with aliases, then delete them
Old screens still say `bg-surface-container-low`. Instead of rewriting them all today, those names now
**point to Vesper tokens** (`--color-surface-container-low: var(--color-panel)`). Every old screen changed
color at once, and each alias is deleted when nothing uses it anymore. The ~120 hardcoded hex values were
mapped mechanically (only ~10 distinct values) to token utilities.

### 5. Fonts through `next/font`
Self-hosted, no layout shift, and exposed as CSS variables (`--font-sora` …) that the tokens map to.

### 6. One component owns the page shell
`workspace/layout.tsx` now adds nothing; `WorkspaceShell` draws header, rail, side panel, editor,
focus hub and status bar. The old `Sidebar`/`TopNav`/`MobileNav` were deleted (still in git history).
The double sidebar is gone because there is only one shell.

### 7. Hide, don't unmount
Switching Code / Split / Notes **hides** panes instead of removing them. The first version unmounted
the note pane, and a draft vanished on every switch. That's the same lesson as the timer bug: state must not
live in something that can disappear.

### 8. Honest empty states
No fake "72%" or "42h". Panels whose data doesn't exist yet say which roadmap step brings it.

## Verified
`npm test` 13/13 · `tsc` clean · `next build` ✓.
**Not yet verified in a browser:** production mode (and your dev browser) failed to load Clerk
("Missing publishableKey" / "Failed to load Clerk JS"). See *Blocker* below.

## Blocker: Clerk keys
The project has no Clerk keys in `.env.local`, so it relies on Clerk's *keyless* dev mode, which needs to
download Clerk's scripts and was failing. Fix: in dashboard.clerk.com → API keys, copy
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into `.env.local`, then restart `npm run dev`.
