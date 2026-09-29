'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, X } from 'lucide-react';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useTracking } from '@/hooks/useTracking';
import { groupTasksByTopic } from '@/lib/group-tasks';
import { formatClock } from '@/lib/session-clock';

// Three phases:  setup (what + how long) → focus (the ring) → wrap-up (reflection)
// When the planned time runs out the session is paused, not ended, and the
// wrap-up opens, so "time's up" never silently throws away your reflection.

const PRESETS = [25, 50, 90]; // minutes
const R = 92;
const RING = 2 * Math.PI * R;
const NEW = '__new__';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';
const control =
  'h-10 w-full rounded-lg border border-line bg-raised px-3 text-[13px] text-ink outline-none transition-colors focus:border-signal';

export function FocusTimer() {
  const timer = useFocusSession();
  const { session, hydrated, pending, error, remaining, progress, pause, resume, abandon } = timer;
  // Which session the wrap-up was opened for, so it can never leak into the next session.
  const [wrapUpFor, setWrapUpFor] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(PRESETS[0]);

  // Time's up → pause (banks exactly the time spent), once per session. The wrap-up
  // then opens by itself: it is derived from "paused with nothing left", not stored.
  const timeUpFor = useRef<string | null>(null);
  useEffect(() => {
    if (session?.status === 'running' && remaining === 0 && timeUpFor.current !== session.id) {
      timeUpFor.current = session.id;
      pause();
    }
  }, [session, remaining, pause]);

  const status = session?.status ?? 'idle';
  const timeUp = status === 'paused' && remaining === 0;
  const showWrapUp = !!session && (wrapUpFor === session.id || timeUp);
  const label2 = !hydrated ? 'Syncing' : status === 'running' ? 'Deep work' : status === 'paused' ? (timeUp ? "Time's up" : 'Paused') : 'Ready';

  return (
    <div className="flex flex-col items-center gap-5">
      <Ring progress={progress} paused={status !== 'running'} time={remaining ?? minutes * 60} caption={label2} idle={status === 'idle'} />

      {status === 'idle' && hydrated && <SessionSetup minutes={minutes} setMinutes={setMinutes} onStart={timer.start} pending={pending} />}

      {session && !showWrapUp && (
        <>
          <CurrentWork taskId={session.taskId} topicId={session.topicId} />
          <div className="flex gap-3">
            {status === 'running' ? (
              <RoundButton primary onClick={pause} disabled={pending} label="Pause"><Pause className="size-5" /></RoundButton>
            ) : (
              <RoundButton primary onClick={resume} disabled={pending || timeUp} label="Resume"><Play className="size-5" /></RoundButton>
            )}
            <RoundButton onClick={() => setWrapUpFor(session.id)} disabled={pending} label="Finish and save"><Check className="size-5" /></RoundButton>
            <RoundButton onClick={abandon} disabled={pending} label="Abandon session"><X className="size-5" /></RoundButton>
          </div>
        </>
      )}

      {showWrapUp && session && (
        <WrapUp
          hasTask={!!session.taskId}
          pending={pending}
          onBack={timeUp ? undefined : () => setWrapUpFor(null)}
          onSave={async (reflection, markDone) => {
            const res = await timer.finish(reflection, markDone);
            if (res && res.ok) setWrapUpFor(null);
          }}
        />
      )}

      {error && <p className="text-xs text-danger text-center max-w-60" role="alert">{error}</p>}
    </div>
  );
}

// ─── The ring ───────────────────────────────────────────────────────────────

function Ring({ progress, paused, time, caption, idle }: { progress: number; paused: boolean; time: number; caption: string; idle: boolean }) {
  return (
    <div className="relative size-52 flex items-center justify-center">
      <svg viewBox="0 0 208 208" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="104" cy="104" r={R} fill="none" className="stroke-raised" strokeWidth="6" />
        <circle
          cx="104" cy="104" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
          className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${paused ? 'stroke-ink-faint' : 'stroke-signal'}`}
          strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)}
        />
      </svg>
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-5xl font-medium tracking-tight tabular" aria-live="polite">
          {formatClock(time)}
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${paused || idle ? 'text-ink-muted' : 'text-signal'}`}>
          {caption}
        </span>
      </div>
    </div>
  );
}

function RoundButton({ primary, label: aria, children, ...rest }: { primary?: boolean; label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={aria}
      title={aria}
      className={`size-12 rounded-full flex items-center justify-center border transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        primary ? 'bg-signal border-signal text-signal-ink hover:brightness-110' : 'bg-raised border-line text-ink hover:border-ink-faint'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Setup: what are you working on? ────────────────────────────────────────

function SessionSetup({ minutes, setMinutes, onStart, pending }: {
  minutes: number;
  setMinutes: (m: number) => void;
  onStart: (input: { plannedSeconds: number; taskId?: string | null; topicId?: string | null }) => Promise<unknown>;
  pending: boolean;
}) {
  const { tracking, createTask, createTopic } = useTracking();
  const [taskId, setTaskId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openTasks = tracking?.tasks.filter((t) => t.status !== 'done') ?? [];
  const topics = tracking?.topics ?? [];
  // Topic first, then its tasks: the same sections as the Tasks panel.
  //   a topic   → only that topic's tasks
  //   no topic  → every open task, grouped by topic (picking one selects its topic)
  //   new topic → it has no tasks yet, so only "+ New task…"
  const topicTasks = topicId === NEW ? [] : topicId ? openTasks.filter((t) => t.topicId === topicId) : null;
  const taskGroups = groupTasksByTopic(topicTasks ?? openTasks);
  const topicName = topics.find((t) => t.id === topicId)?.name;

  function pickTopic(id: string) {
    setTopicId(id);
    // A task from another topic no longer fits: clear it.
    const task = openTasks.find((t) => t.id === taskId);
    if (task && id && task.topicId !== id) setTaskId('');
  }

  function pickTask(id: string) {
    setTaskId(id);
    const task = openTasks.find((t) => t.id === id);
    if (task) setTopicId(task.topicId ?? '');
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      let topic: string | null = topicId && topicId !== NEW ? topicId : null;
      if (topicId === NEW && newTopic.trim()) {
        const res = await createTopic(newTopic);
        if ('error' in res) return setError(res.error ?? null);
        topic = res.data.id;
      }
      let task: string | null = taskId && taskId !== NEW ? taskId : null;
      if (taskId === NEW && newTask.trim()) {
        const res = await createTask(newTask, topic);
        if ('error' in res) return setError(res.error ?? null);
        task = res.data.id;
      }
      await onStart({ plannedSeconds: minutes * 60, taskId: task, topicId: topic });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="setup-topic" className={label}>Topic</label>
        <select id="setup-topic" value={topicId} onChange={(e) => pickTopic(e.target.value)} className={control}>
          <option value="">Any topic</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          <option value={NEW}>+ New topic…</option>
        </select>
        {topicId === NEW && (
          <input
            autoFocus aria-label="New topic name" value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g. Clean code" maxLength={60} className={control}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="setup-task" className={label}>Working on</label>
        <select id="setup-task" value={taskId} onChange={(e) => pickTask(e.target.value)} className={control}>
          <option value="">No specific task</option>
          {topicTasks
            ? topicTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)
            : taskGroups.map((group) => (
                <optgroup key={group.topicId ?? 'none'} label={group.topicName ?? 'No topic'}>
                  {group.tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </optgroup>
              ))}
          <option value={NEW}>{topicName ? `+ New task in ${topicName}…` : '+ New task…'}</option>
        </select>
        {topicTasks && topicTasks.length === 0 && topicId !== NEW && (
          <p className="text-[11px] text-ink-muted">No open tasks in {topicName} yet. Add one here or in the Tasks panel.</p>
        )}
        {taskId === NEW && (
          <input
            autoFocus={topicId !== NEW} aria-label="New task title" value={newTask} onChange={(e) => setNewTask(e.target.value)}
            placeholder="e.g. Refactor the service layer" maxLength={140} className={control}
          />
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-full bg-raised" role="radiogroup" aria-label="Session length">
        {PRESETS.map((m) => (
          <button
            key={m} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)}
            className={`flex-1 h-8 rounded-full text-xs font-semibold tabular transition-colors ${minutes === m ? 'bg-panel text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            {m} min
          </button>
        ))}
      </div>

      <button
        onClick={start}
        disabled={pending || busy || (taskId === NEW && !newTask.trim()) || (topicId === NEW && !newTopic.trim())}
        className="h-11 rounded-lg bg-signal text-signal-ink text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40 transition"
      >
        <Play className="size-4" /> Start {minutes}-minute session
      </button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ─── During a session: what you're on ───────────────────────────────────────

function CurrentWork({ taskId, topicId }: { taskId: string | null; topicId: string | null }) {
  const { tracking } = useTracking();
  const task = tracking?.tasks.find((t) => t.id === taskId);
  const topic = tracking?.topics.find((t) => t.id === topicId);
  if (!task && !topic) return null;
  return (
    <div className="text-center">
      {task && <p className="text-[15px] font-semibold">{task.title}</p>}
      {topic && <p className="text-xs text-ink-muted mt-0.5">{topic.name}</p>}
    </div>
  );
}

// ─── Wrap-up: reflection + task status ──────────────────────────────────────

function WrapUp({ hasTask, pending, onBack, onSave }: {
  hasTask: boolean;
  pending: boolean;
  onBack?: () => void;
  onSave: (reflection: string, markTaskDone: boolean) => void;
}) {
  const [reflection, setReflection] = useState('');
  const [markDone, setMarkDone] = useState(false);
  return (
    <form
      className="w-full flex flex-col gap-3"
      onSubmit={(e) => { e.preventDefault(); onSave(reflection, markDone); }}
    >
      <label htmlFor="reflection" className={label}>What did you learn?</label>
      <textarea
        id="reflection" autoFocus rows={4} maxLength={2000} value={reflection} onChange={(e) => setReflection(e.target.value)}
        placeholder="One or two sentences you'll thank yourself for later."
        className="w-full resize-none rounded-lg border border-line bg-raised px-3 py-2.5 text-[13px] leading-6 text-ink placeholder:text-ink-faint outline-none focus:border-signal"
      />
      {hasTask && (
        <label className="flex items-center gap-2.5 text-[13px] text-ink">
          <input type="checkbox" checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} className="size-4 accent-[var(--color-signal)]" />
          Mark the task as done
        </label>
      )}
      <div className="flex gap-2">
        {onBack && (
          <button type="button" onClick={onBack} className="h-10 flex-1 rounded-lg border border-line text-[13px] font-semibold text-ink-muted hover:text-ink">
            Keep going
          </button>
        )}
        <button type="submit" disabled={pending} className="h-10 flex-[2] rounded-lg bg-signal text-signal-ink text-[13px] font-semibold hover:brightness-110 disabled:opacity-40">
          Save session
        </button>
      </div>
    </form>
  );
}
