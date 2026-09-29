# 007 — Topics drive tasks, a real file tree, and ▶ Run

**Date:** 2026-09-29
**Files:** `src/components/workspace/{TasksPanel,FocusTimer,FilesPanel,TerminalPanel,WorkspaceShell,CodePane}.tsx`,
`src/data/{files,runner}.ts`, `src/app/actions/files.ts`, `src/hooks/{useFiles,useRunner}.ts`,
`src/lib/{languages,group-tasks,run-in-browser}.ts`, `scripts/*`, `docker-compose.yml`

## 1. Bugs fixed first
- **A session left running banked unlimited time.** Close the laptop on a 10-minute session, come back 5 hours later: 5 hours of "focus".
  Pause and finish now bank `least(planned, focused + stretch)`; the browser caps the same way. A test proved 18,000 s before the fix.
- Network failures in timer actions, the tracking load and the sign-in form now show a message instead of failing silently.

## 2. Topics drive tasks
- The Tasks panel is **one section per topic**, each with its own "Add a task to …" row, so a task is always born inside its topic.
- Under the timer: **topic first**, then "Working on" lists only that topic's tasks. Picking a task still selects its topic.

## 3. Files, folders, projects (IDE-1, from journal 006)
- The `files` table (adjacency list) is finally used: files and folders, deleting a folder cascades to its contents.
- **Autosave** 1 s after typing stops, Ctrl+S to save now, one save at a time.
- **Optimistic concurrency:** each save sends the `updated_at` it was based on; a stale tab gets *Changed elsewhere* instead of overwriting.
  Gotcha: JS dates have milliseconds, Postgres microseconds, so the compare is `date_trunc('milliseconds', updated_at) = $expected`.
- **Clean Architecture template:** one transaction creates `X.Domain`, `X.Application`, `X.Infrastructure`, `X.Api` with starter files.
- Changing a file's language renames its extension (`Program.cs` → `Program.py`) unless you typed a custom one.
- Monaco is now **served by the app** (`scripts/copy-monaco.mjs` → `public/monaco`) instead of the jsdelivr CDN: ~6 ms per file locally
  vs ~250 ms, and dozens of files. This was the slow "Loading editor…".

## 4. ▶ Run and the terminal (IDE-3 and IDE-4)
| Language | Where it runs | Why |
|---|---|---|
| JavaScript, TypeScript | A **Web Worker** in the browser, 5 s limit | No server risk at all; TS is compiled by the TypeScript worker inside Monaco (`monaco.typescript` in 0.55) |
| C#, Python, Java | **Piston** in Docker, bound to 127.0.0.1 | Rule #1 from 006: user code never runs in the Next.js server. Sandbox, no network, 5 s run / 30 s compile, 256 MB |

Lessons from making C# work:
- .NET's build takes ~10 s, above Piston's default 10 s compile cap → raised to 30 s (`PISTON_COMPILE_TIMEOUT`).
- The runtime is **.NET 5: no implicit usings**, so `Console.WriteLine` alone fails. We prepend the usings **on line 1**, so error line numbers still match.
- Piston's script appends `.cs` itself and generates its own `Program.cs`: a file named `Program` collides. We submit it as `main`.

## 5. The incident
Installing five runtimes filled the **C: drive to 0 bytes**: Docker's disk image lives there, and it isn't sparse. Docker reported I/O errors.
Recovery: space freed, Docker restarted, the database verified with a full `pg_dump` read. C++ and Go were dropped, and
`runner:install` now refuses to download when the system drive has less than 5 GB free.
**Lesson: check free disk space before any large download, and know where Docker keeps its data.**

## Verified
`npm test`: **52 tests** (sessions, tracking, auth, files with folders/conflicts/templates, runner for Python and C#, pure helpers).
`tsc` and ESLint clean. The workspace compiles and loads on the dev server.
