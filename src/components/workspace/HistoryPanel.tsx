'use client';

import { useTracking } from '@/hooks/useTracking';
import { formatDayLabel, formatDuration } from '@/lib/format';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';

/** The last 30 days of finished sessions, grouped by local day. */
export function HistoryPanel() {
  const { tracking, error } = useTracking();

  if (error) return <p role="alert" className="px-2 text-xs text-danger">{error}</p>;
  if (!tracking) return <div className="mx-2 h-32 rounded-lg bg-raised animate-pulse" aria-hidden="true" />;

  const { history, today } = tracking;
  return (
    <div className="flex flex-col gap-5">
      <span className={`${label} px-2`}>History</span>
      {history.length === 0 && (
        <p className="px-2 text-[13px] leading-6 text-ink-faint">
          Finish your first session and it will appear here, with what you learned.
        </p>
      )}
      {history.map((day) => (
        <section key={day.day} aria-label={formatDayLabel(day.day, today.today)} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between px-2 pb-1">
            <h3 className="text-[13px] font-semibold">{formatDayLabel(day.day, today.today)}</h3>
            <span className="text-xs font-mono text-ink-muted">{formatDuration(day.totalSeconds)}</span>
          </div>
          <ol className="flex flex-col gap-px">
            {day.sessions.map((s) => (
              <li key={s.id} className="rounded-lg px-2 py-2 hover:bg-raised">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-[13px] truncate ${s.status === 'abandoned' ? 'text-ink-faint' : 'text-ink'}`}>
                    {s.taskTitle ?? s.topicName ?? 'Focus session'}
                  </span>
                  <span className="shrink-0 text-xs font-mono text-ink-muted tabular">{formatDuration(s.focusedSeconds)}</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {s.taskTitle && s.topicName ? ` · ${s.topicName}` : ''}
                  {s.status === 'abandoned' ? ' · abandoned' : ''}
                </p>
                {s.reflection && (
                  <p className="mt-1.5 border-l-2 border-signal/40 pl-2 text-xs leading-5 text-ink-muted">{s.reflection}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
