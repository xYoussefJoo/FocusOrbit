# 002 — Running Postgres with Docker

**Date:** 2026-09-25
**Files:** `docker-compose.yml`, `.env.example`, `.env.local`

## The problem
The app needs a Postgres server. Installing it directly on Windows works, but then the
version, settings and data are tied to this one machine, and they're painful to reset.

## What Docker gives us
| Concept | In our project |
|---|---|
| **Image**: a read-only template | `postgres:17-alpine` (Postgres 17 on a tiny Linux) |
| **Container**: a running instance of an image | `focusorbit-db` |
| **Port mapping** `host:container` | `5433:5432`: your PC's port 5433 → Postgres's 5432 inside |
| **Volume**: storage that outlives the container | `pgdata`, where your tables live |
| **Compose**: describe services in YAML, start them with one command | `docker-compose.yml` |

The container is disposable. The volume is not: `docker compose down` removes the
container but keeps your data, and `down -v` deletes the data too.

**Why port 5433?** If you ever install Postgres natively it will take 5432. Using 5433 avoids a
confusing "wrong database" bug.

## One-time setup
1. Install **Docker Desktop for Windows** (it uses WSL 2), then restart.
2. Open Docker Desktop once so the engine starts.
3. Check it: `docker --version`

## Daily commands
```bash
npm run db:up        # start Postgres in the background
npm run db:migrate   # apply SQL files in /drizzle to the DB
npm run db:seed      # add demo data (user_demo)
npm run db:studio    # browse tables in the browser
npm run db:down      # stop it (data is kept)
```

## Changing the schema later
```bash
# 1. edit src/db/schema.ts
npm run db:generate -- --name add_something   # 2. writes a new drizzle/000N_*.sql
# 3. read the SQL. Never apply a migration you haven't read.
npm run db:migrate                            # 4. apply it
```
Migrations are committed to git: they are the history of the database, the same way commits
are the history of the code.

## Useful Docker commands to explore
```bash
docker ps                                   # what's running
docker logs focusorbit-db                   # Postgres output
docker exec -it focusorbit-db psql -U focusorbit   # raw SQL shell (\dt lists tables, \q quits)
docker volume ls                            # see the pgdata volume
```

## What actually happened (troubleshooting log)
1. `docker run hello-world` → *"Docker Desktop is unable to start"*. The message was too vague to act on.
2. Read Docker's own log (`%LOCALAPPDATA%\Docker\log\host\com.docker.backend.exe.log`):
   `API proxy is serving requests (no virtualization available)`.
3. Checked the machine: virtualization was ON in the BIOS, but `wsl` printed only its old usage text → the **WSL feature was not enabled**.
4. Enabled it (admin): `dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux` and `…:VirtualMachinePlatform`.
   Exit code `3010` = success, restart required.
5. Restarted (Start → Power → **Restart**. On Windows 10 "Shut down" uses Fast Startup and may not apply features).
   `HypervisorPresent` changed from False → True.
6. The built-in `wsl.exe` was too old. `wsl --update --web-download` (admin) installed **WSL 2.7.14**.
   (`--web-download` belongs to `--update`, not `--install`, a mistake we made along the way.)
7. Docker engine up in 15 s → `hello-world` ✓ → `db:up` → healthy in 8 s → `db:migrate` ✓ → `db:seed` ✓.

## Proving the rules hold
We tried to break the database on purpose. All four writes were rejected:

| Attempt | Rejected by |
|---|---|
| Second running session for the same user | `focus_sessions_one_active_per_user` (partial unique index) |
| `planned_seconds = 0` | `focus_sessions_planned_positive` (CHECK) |
| Duplicate `src` folder at the root | `files_sibling_name_unique` (NULLS NOT DISTINCT) |
| Folder with content | `files_folder_has_no_content` (CHECK) |

**Lesson:** a rule you haven't tried to break is a rule you haven't tested.
