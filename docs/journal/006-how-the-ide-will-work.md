# 006 — How the IDE will work (the plan, before the code)

**Date:** 2026-09-25 · **Status:** design. Nothing here is built yet except the editor itself.

## The question
"We have Monaco on the screen. How does that become an IDE?"
An IDE is not one thing. It is **four layers**, and each one is a separate decision:

```
┌──────────────────────────────────────────────────────────────┐
│ 4. RUN        execute code, show output          (hardest)   │
│ 3. UNDERSTAND autocomplete, errors, go-to-definition         │
│ 2. STORE      where files live, save / load / tree           │
│ 1. EDIT       text, syntax colors, cursor        ✓ Monaco    │
└──────────────────────────────────────────────────────────────┘
```

## Layer 1 — Edit ✓
Monaco (the editor inside VS Code) is already running with the Vesper theme. Nothing to decide.

## Layer 2 — Store: where do files live?
| Option | Good | Bad |
|---|---|---|
| **A. Our Postgres (`files` table)** ✓ | Already in the schema; synced across devices; files can link to sessions | Needs a tree query and a save strategy |
| B. Browser storage (OPFS / IndexedDB) | Works offline, instant | Stuck on one browser; lost if storage is cleared |
| C. A real folder on your disk (File System Access API) | Edit your actual projects | Chromium only; permission prompts; nothing to sync |
| D. Git / GitHub | Real projects, history, sharing | OAuth, API limits: a big feature on its own |

**Plan: A now, D later.** The `files` table already exists (chapter 07, the "adjacency list").

How it will work:
- **Reading the tree:** one recursive query:
  ```sql
  WITH RECURSIVE tree AS (
    SELECT * FROM files WHERE user_id = $1 AND parent_id IS NULL
    UNION ALL
    SELECT f.* FROM files f JOIN tree t ON f.parent_id = t.id
  ) SELECT * FROM tree;
  ```
- **Create / rename / move / delete:** single statements; the `UNIQUE NULLS NOT DISTINCT` rule already blocks duplicate names in a folder.
- **Saving:** autosave ~1 s after you stop typing (debounce), and a status of "Saving…" / "Saved" in the status bar.
- **Two tabs editing one file:** the same lesson as the timer. Save with a guarded UPDATE:
  `UPDATE files SET content = $new WHERE id = $id AND updated_at = $whatILoaded`.
  0 rows means someone else saved first → show "This file changed elsewhere" instead of silently overwriting (*optimistic concurrency*).
- **Link to sessions:** remember which files you edited during a session, so History can show "what you coded", not just "how long".

## Layer 3 — Understand (autocomplete & errors)
- **TypeScript / JavaScript / JSON / CSS / HTML:** Monaco includes these language services for free, running in Web Workers in your browser.
- **C#, Python, Go …** need a *language server* (e.g. OmniSharp, Pyright) running on a server and talking to Monaco over a WebSocket (the LSP protocol).
  That's heavy infrastructure. **Plan: rely on Monaco's built-ins first; add LSP only for a language you really need.**

## Layer 4 — Run: executing code safely
This is the dangerous layer. **Rule #1: never run a user's code inside our Next.js server.** It could read our secrets,
our database, or crash the app.

| Option | Languages | Cost / risk |
|---|---|---|
| **1. Sandboxed iframe / Web Worker in the browser** | JS / TS | Free; runs on the user's machine, so no server risk |
| 2. WebContainers (Node.js inside the browser) | JS / Node | Powerful, but a commercial licence for production use |
| **3. Self-hosted runner in Docker (e.g. Piston)** | Dozens (C#, Python, Go …) | Our server runs it: needs strict limits (CPU, memory, time, no network) |
| 4. A container per user (like Codespaces) | Anything | Expensive and complex, a product on its own |

**Plan:**
1. **JS/TS first**, in a sandboxed iframe with a console panel. Zero server risk, a great first "Run ▶".
2. **More languages** via a runner container added to our `docker-compose.yml` (we already know Docker from chapter 09),
   called from a Server Action with hard limits: 5 s timeout, capped memory, no network.

## The proposed build order
| Phase | What you get | What you learn |
|---|---|---|
| **IDE-1** | Real files: tree from Postgres, open, create, rename, delete, autosave | Recursive SQL, debouncing, optimistic concurrency |
| **IDE-2** | Notes saved (the note pane → `notes` table, linked to the session) | Reusing the same save pattern |
| **IDE-3** | ▶ Run JS/TS in a sandbox, with a console panel | iframes, `postMessage`, sandboxing |
| **IDE-4** | Multi-language runner in Docker | Isolation, resource limits, untrusted input |
| IDE-5 | (Optional) GitHub import, LSP | OAuth, WebSockets, protocols |
