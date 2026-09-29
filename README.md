# FocusOrbit · Vesper

A focus workspace for developers: a **focus timer** that knows what you're working on, **tasks grouped by topic**,
a **history** of what you learned, and a small **IDE** where you write, save and run code, all in one screen.

Built with Next.js 16 (App Router, Server Actions), PostgreSQL 17, Drizzle ORM and self-hosted Better Auth.

## Features

- **Focus sessions:** start, pause, resume, finish or abandon. Time is counted by the database clock, so two tabs,
  a sleeping laptop or a wrong system clock can't corrupt it. Only one active session per user (a partial unique index).
- **Topics and tasks:** every topic is a section with its own tasks. Under the timer you pick a topic, then one of its tasks.
- **Wrap-up and history:** write what you learned when a session ends; history is grouped by your local day, with a daily goal and a streak.
- **Workspace IDE:**
  - Files and folders saved to Postgres, with autosave and conflict detection between tabs.
  - A **Clean Architecture (.NET)** project template (Domain, Application, Infrastructure, Api).
  - Pick a language per file; changing it also changes the extension.
  - **▶ Run** with a terminal: JavaScript/TypeScript run in a browser Web Worker; C#, Python and Java run in a sandboxed
    [Piston](https://github.com/engineer-man/piston) container with time and memory limits.
- **Auth:** email + password with Better Auth on our own tables (scrypt hashes, httpOnly session cookie), open-redirect protection.

## Architecture

```
Browser (React 19, Zustand)  →  Server Actions (src/app/actions)  →  runAction: who is signed in?
                                                                  →  Data Access Layer (src/data): validate, check ownership,
                                                                     one guarded SQL statement
                                                                  →  PostgreSQL 17 (Docker) via Drizzle
```

Every query is scoped by the signed-in user's id, and state changes are single guarded `UPDATE`s
(e.g. pause only `WHERE status = 'running'`). The build journal in [`docs/journal`](docs/journal) explains each decision.

## Getting started

Requirements: Node 20+, Docker.

```bash
npm install                 # also copies the Monaco editor into public/monaco
cp .env.example .env.local  # then set BETTER_AUTH_SECRET
npm run db:up               # PostgreSQL on port 5433
npm run db:migrate
npm run db:seed             # optional: demo@vesper.dev / vesper-demo-123
npm run dev                 # http://localhost:3000
```

To run C#, Python and Java code (optional, needs ~2.5 GB of Docker disk):

```bash
npm run runner:up           # the Piston sandbox, bound to 127.0.0.1:2000
npm run runner:install      # downloads the runtimes once (refuses when the disk is low)
```

## Tests

```bash
npm test    # 52 tests; the data tests run against the real Docker Postgres
```

They cover the session lifecycle, authorization between users, timezone-aware history and streaks, file saving with
conflicts, folders and templates, and running code (the runner tests skip themselves when the runner isn't up).

## Project layout

```
src/app/actions/   Server Actions: the app's API
src/data/          Data Access Layer: business rules and SQL
src/db/            Drizzle schema and client
src/lib/           Pure helpers (timer math, streaks, languages …), unit-tested
src/hooks/         Client hooks: sessions, tracking, files, runner
src/components/    Workspace UI
drizzle/           SQL migrations
docs/journal/      Build journal: why each decision was made
scripts/           Monaco copy + runtime installer
```
