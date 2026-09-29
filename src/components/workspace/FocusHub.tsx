'use client';

import { Flame } from 'lucide-react';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useTracking } from '@/hooks/useTracking';
import { formatDuration } from '@/lib/format';
import { FocusTimer } from './FocusTimer';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';

export function FocusHub() {
  return (
    <aside aria-label="Focus hub" className="w-80 shrink-0 hidden lg:flex flex-col gap-7 px-6 py-7 border-l border-line bg-panel overflow-y-auto scrollbar-thin">
      <FocusTimer />
      <TodayCard />
    </aside>
  );
}

function TodayCard() {
  const { tracking } = useTracking();
  const { focused, session } = useFocusSession();
  const today = tracking?.today;
  if (!today) return <div className="h-28 rounded-xl bg-raised animate-pulse" aria-hidden="true" />;

  // Finished sessions come from the server; the live one is added here so the bar moves while you work.
  const total = today.focusedSeconds + (session ? focused : 0);
  const pct = Math.min(100, Math.round((total / today.goalSeconds) * 100));

  return (
    <section aria-label="Today" className="flex flex-col gap-4">
      <span className={label}>Today</span>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-3xl font-medium tabular">{formatDuration(total)}</span>
        <span className="text-xs text-ink-muted">of {formatDuration(today.goalSeconds)} goal</span>
      </div>
      <div
        role="progressbar" aria-label="Daily goal" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
        className="h-1.5 rounded-full bg-raised overflow-hidden"
      >
        <div className="h-full rounded-full bg-signal transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-raised px-4 py-3">
          <dt className="text-xs text-ink-muted">Streak</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular">
            <Flame className={`size-4 ${today.streakDays > 0 ? 'text-signal' : 'text-ink-faint'}`} aria-hidden="true" />
            {today.streakDays} {today.streakDays === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div className="rounded-xl bg-raised px-4 py-3">
          <dt className="text-xs text-ink-muted">Sessions</dt>
          <dd className="mt-1 text-lg font-semibold tabular">{today.sessionsCompleted}</dd>
        </div>
      </dl>
    </section>
  );
}
