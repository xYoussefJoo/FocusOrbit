'use client';

import { useState } from 'react';
import { Circle, CircleCheck, CircleDot, Plus } from 'lucide-react';
import { useTracking } from '@/hooks/useTracking';
import type { TaskDTO } from '@/data/tasks';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';

export function TasksPanel() {
  const { tracking, error, createTask, setTaskStatus } = useTracking();
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await createTask(title);
    if ('error' in res) return setFormError(res.error ?? null);
    setTitle('');
    setFormError(null);
  }

  const tasks = tracking?.tasks ?? [];
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="flex flex-col gap-4">
      <span className={`${label} px-2`}>Tasks</span>

      <form onSubmit={add} className="flex gap-2 px-1">
        <label htmlFor="new-task" className="sr-only">New task</label>
        <input
          id="new-task" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Add a task…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-ink-faint outline-none focus:border-signal"
        />
        <button type="submit" aria-label="Add task" className="size-9 shrink-0 rounded-lg bg-raised border border-line flex items-center justify-center text-ink-muted hover:text-ink">
          <Plus className="size-4" />
        </button>
      </form>
      {(formError || error) && <p role="alert" className="px-2 text-xs text-danger">{formError ?? error}</p>}

      {!tracking ? (
        <div className="mx-2 h-24 rounded-lg bg-raised animate-pulse" aria-hidden="true" />
      ) : open.length === 0 && done.length === 0 ? (
        <p className="px-2 text-[13px] leading-6 text-ink-faint">No tasks yet. Add one here, or when you start a session.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-px">
            {open.map((t) => <TaskRow key={t.id} task={t} onToggle={() => setTaskStatus(t.id, 'done')} />)}
          </ul>
          {done.length > 0 && (
            <>
              <span className={`${label} px-2 pt-2`}>Done</span>
              <ul className="flex flex-col gap-px">
                {done.map((t) => <TaskRow key={t.id} task={t} onToggle={() => setTaskStatus(t.id, 'todo')} />)}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: TaskDTO; onToggle: () => void }) {
  const done = task.status === 'done';
  const Icon = done ? CircleCheck : task.status === 'in_progress' ? CircleDot : Circle;
  return (
    <li className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-raised">
      <button
        onClick={onToggle}
        aria-label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" as done`}
        className="mt-0.5 shrink-0 text-ink-faint hover:text-signal"
      >
        <Icon className={`size-4 ${done ? 'text-signal' : task.status === 'in_progress' ? 'text-signal' : ''}`} />
      </button>
      <div className="min-w-0">
        <p className={`text-[13px] leading-5 ${done ? 'text-ink-faint line-through' : 'text-ink'}`}>{task.title}</p>
        {(task.topicName || task.status === 'in_progress') && (
          <p className="text-[11px] text-ink-muted">
            {task.status === 'in_progress' && !done ? 'In progress' : ''}
            {task.status === 'in_progress' && task.topicName && !done ? ' · ' : ''}
            {task.topicName}
          </p>
        )}
      </div>
    </li>
  );
}
