import Link from 'next/link';
import { ArrowRight, Columns2, Flame, ListChecks, Timer } from 'lucide-react';
import { VesperMark } from '@/components/workspace/VesperMark';
import { getCurrentUser } from '@/data/auth';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/80 backdrop-blur-md">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <VesperMark size={26} />
            <span className="font-display text-lg font-medium tracking-tight">Vesper</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-ink-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/workspace" className="inline-flex h-9 items-center gap-2 rounded-lg bg-signal px-4 text-sm font-semibold text-signal-ink hover:brightness-110">
                Open workspace <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-ink-muted hover:text-ink">
                  Sign in
                </Link>
                <Link href="/sign-up" className="inline-flex h-9 items-center rounded-lg bg-signal px-4 text-sm font-semibold text-signal-ink hover:brightness-110">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <svg aria-hidden="true" viewBox="0 0 800 800" className="pointer-events-none absolute -right-72 -top-40 w-[900px] opacity-50">
            <circle cx="400" cy="400" r="380" fill="none" className="stroke-line" />
            <circle cx="400" cy="400" r="290" fill="none" className="stroke-line" />
            <circle cx="400" cy="400" r="200" fill="none" className="stroke-line" />
            <circle cx="669" cy="131" r="6" className="fill-signal" />
          </svg>
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">A focus workspace for developers</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
              Evening focus,
              <br />
              engineered.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
              Write code and notes side by side, run a timer that never drifts, and keep a history of everything you studied, one session at a time.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={user ? '/workspace' : '/sign-up'}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-signal px-6 text-[15px] font-semibold text-signal-ink hover:brightness-110"
              >
                {user ? 'Open your workspace' : 'Start your first session'} <ArrowRight className="size-4" />
              </Link>
              <a href="#how" className="inline-flex h-12 items-center rounded-lg border border-line px-6 text-[15px] font-semibold text-ink-muted hover:border-ink-faint hover:text-ink">
                See how it works
              </a>
            </div>

            <WorkspacePreview />
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section id="how" className="border-t border-line bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">One session, three steps.</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                ['01', 'Pick what matters', 'Choose a task and a topic, then 25, 50 or 90 minutes. Vesper remembers what the time was for.'],
                ['02', 'Focus', 'Code on one side, notes on the other. Pause, switch tabs, even refresh: the timer lives in the database, so it never drifts or resets.'],
                ['03', 'Reflect', 'When time is up, write what you learned. It lands in your history, next to the minutes it took.'],
              ].map(([n, title, text]) => (
                <li key={n} className="rounded-2xl border border-line bg-canvas p-7">
                  <span className="font-mono text-sm text-signal">{n}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-ink-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section id="features" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Built for the hours when the house is quiet.
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {[
                [Columns2, 'Code and notes, side by side', 'A real code editor next to a note pane. Switch between code, split and notes without losing a word.'],
                [Timer, 'A timer you can trust', 'Time is calculated from timestamps on the server, not counted down in the browser, so background tabs and refreshes never cost you minutes.'],
                [ListChecks, 'Tasks and topics', 'Plan what to do, start a session on it, and mark it done when you wrap up. Every minute is tied to what it was for.'],
                [Flame, 'History and streaks', 'Every session grouped by day in your own timezone, with your daily goal and a streak that counts consecutive days.'],
              ].map(([Icon, title, text]) => {
                const I = Icon as typeof Timer;
                return (
                  <div key={title as string} className="bg-canvas p-8">
                    <I className="size-5 text-signal" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold">{title as string}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-ink-muted">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ─────────────────────────────────────────────────── */}
        <section className="border-t border-line bg-panel">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-24 sm:px-6 md:flex-row md:items-center md:justify-between">
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Tonight&apos;s session starts here.</h2>
            <Link
              href={user ? '/workspace' : '/sign-up'}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-signal px-6 text-[15px] font-semibold text-signal-ink hover:brightness-110"
            >
              {user ? 'Open workspace' : 'Create a free account'} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:justify-between sm:px-6">
          <span className="flex items-center gap-2"><VesperMark size={18} /> Vesper</span>
          <span>Evening focus, engineered.</span>
        </div>
      </footer>
    </div>
  );
}

/** A lightweight, non-interactive picture of the workspace, drawn with the real tokens. */
function WorkspacePreview() {
  const code = [
    ['text-ink-faint italic', '// Every transition is one guarded UPDATE.'],
    ['', <><span className="text-signal">export async function</span> pauseSession(userId, id) {'{'}</>],
    ['pl-5', <><span className="text-signal">const</span> [row] = <span className="text-signal">await</span> db.update(focusSessions)</>],
    ['pl-10', <>.set({'{'} status: <span className="text-code-string">&apos;paused&apos;</span> {'}'})</>],
    ['pl-10', <>.where(eq(focusSessions.status, <span className="text-code-string">&apos;running&apos;</span>))</>],
    ['pl-5', <><span className="text-signal">return</span> toDTO(row);</>],
    ['', '}'],
  ] as const;
  return (
    <div aria-hidden="true" className="mt-16 overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/50">
      <div className="flex h-10 items-center gap-2 border-b border-line px-4">
        <span className="size-2.5 rounded-full bg-raised" /><span className="size-2.5 rounded-full bg-raised" /><span className="size-2.5 rounded-full bg-raised" />
        <span className="ml-3 text-xs text-ink-muted">Vesper / sessions.ts</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-signal-soft px-2.5 py-0.5 text-[11px] font-semibold text-signal">
          <span className="size-1.5 rounded-full bg-signal" /> In session
        </span>
      </div>
      <div className="grid md:grid-cols-[1fr_1fr_220px]">
        <div className="border-b border-line bg-canvas p-6 font-mono text-[13px] leading-7 md:border-b-0 md:border-r">
          {code.map(([cls, line], i) => (
            <div key={i} className="flex gap-5 whitespace-pre">
              <span className="w-4 text-right text-ink-faint/60">{i + 1}</span>
              <span className={cls}>{line}</span>
            </div>
          ))}
        </div>
        <div className="hidden border-r border-line p-6 md:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Session note</p>
          <p className="mt-3 font-display text-2xl font-medium">What I learned today</p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            The WHERE clause <em>is</em> the check, so two tabs can never pause the same session twice.
          </p>
        </div>
        <div className="hidden flex-col items-center justify-center gap-3 p-6 md:flex">
          <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" className="stroke-raised" strokeWidth="5" />
            <circle cx="60" cy="60" r="52" fill="none" className="stroke-signal" strokeWidth="5" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset="120" />
          </svg>
          <span className="-mt-[5.5rem] mb-12 font-display text-2xl font-medium tabular">15:48</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-signal">Deep work</span>
        </div>
      </div>
    </div>
  );
}
