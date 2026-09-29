'use client';

import { useState } from 'react';
import { Circle, CircleCheck, CircleDot, Plus } from 'lucide-react';
import { useTracking } from '@/hooks/useTracking';
import { groupTasksByTopic } from '@/lib/group-tasks';
import type { TaskDTO } from '@/data/tasks';

const label = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted';
const control =
  'h-8 w-full min-w-0 rounded-lg border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-ink-faint outline-none focus:border-signal';

// Topics are the sections of the task list. Every topic shows up (even with no tasks
// yet) with its own "Add task" row, so a task is always created inside its topic, and
// the timer's topic picker offers exactly the same tasks.
export function TasksPanel() {
  const { tracking, error, createTask, createTopic, setTaskStatus } = useTracking();
  const [newTopic, setNewTopic] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const res = await createTopic(newTopic);
    if ('error' in res) return setFormError(res.error ?? null);
    setNewTopic('');
    setAddingTopic(false);
    setFormError(null);
  }

  const tasks = tracking?.tasks ?? [];
  const topics = tracking?.topics ?? [];
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const grouped = new Map(groupTasksByTopic(open).map((g) => [g.topicId, g.tasks]));
  // One section per topic (A → Z, as the server sends them), then "No topic".
  const sections = [
    ...topics.map((t) => ({ topicId: t.id as string | null, name: t.name, tasks: grouped.get(t.id) ?? [] })),
    { topicId: null, name: 'No topic', tasks: grouped.get(null) ?? [] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-2">
        <span className={label}>Tasks</span>
        <button
          onClick={() => { setAddingTopic(!addingTopic); setFormError(null); }}
          aria-expanded={addingTopic}
          className="h-7 px-2 flex items-center gap-1 rounded-md text-xs font-semibold text-ink-muted hover:bg-raised hover:text-ink"
        >
          <Plus className="size-3.5" /> New topic
        </button>
      </div>

      {addingTopic && (
        <form onSubmit={addTopic} className="flex gap-2 px-1">
          <label htmlFor="new-topic" className="sr-only">New topic name</label>
          <input
            id="new-topic" autoFocus value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
            maxLength={60} placeholder="e.g. Clean code" className={control}
          />
          <button type="submit" disabled={!newTopic.trim()} className="h-8 px-3 shrink-0 rounded-lg bg-signal text-signal-ink text-xs font-semibold disabled:opacity-40">
            Add
          </button>
        </form>
      )}
      {(formError || error) && <p role="alert" className="px-2 text-xs text-danger">{formError ?? error}</p>}

      {!tracking ? (
        <div className="mx-2 h-24 rounded-lg bg-raised animate-pulse" aria-hidden="true" />
      ) : (
        <>
          {topics.length === 0 && open.length === 0 && (
            <p className="px-2 text-[13px] leading-6 text-ink-faint">
              Start with a <strong className="text-ink-muted">New topic</strong> (for example &ldquo;Clean code&rdquo;), then add its tasks.
            </p>
          )}
          {sections.map((s) => (
            <TopicSection
              key={s.topicId ?? 'none'}
              topicId={s.topicId}
              name={s.name}
              tasks={s.tasks}
              // Hide the empty "No topic" section; it appears once a task has no topic.
              hidden={s.topicId === null && s.tasks.length === 0}
              onAdd={(title) => createTask(title, s.topicId)}
              onDone={(id) => setTaskStatus(id, 'done')}
            />
          ))}
          {done.length > 0 && (
            <section aria-label="Done" className="flex flex-col gap-1">
              <span className={`${label} px-2`}>Done</span>
              <ul className="flex flex-col gap-px">
                {done.map((t) => <TaskRow key={t.id} task={t} showTopic onToggle={() => setTaskStatus(t.id, 'todo')} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TopicSection({ topicId, name, tasks, hidden, onAdd, onDone }: {
  topicId: string | null;
  name: string;
  tasks: TaskDTO[];
  hidden: boolean;
  onAdd: (title: string) => Promise<{ error?: string } | { data: unknown }>;
  onDone: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (hidden) return null;
  const inputId = `add-task-${topicId ?? 'none'}`;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await onAdd(title);
    if ('error' in res && res.error) return setError(res.error);
    setTitle('');
    setError(null);
  }

  return (
    <section aria-label={name} className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between px-2">
        <h3 className={`text-[13px] font-semibold ${topicId ? 'text-ink' : 'text-ink-muted'}`}>{name}</h3>
        <span className="text-[11px] text-ink-faint tabular">{tasks.length}</span>
      </div>
      <ul className="flex flex-col gap-px">
        {tasks.map((t) => <TaskRow key={t.id} task={t} onToggle={() => onDone(t.id)} />)}
      </ul>
      <form onSubmit={add} className="flex items-center gap-2 pl-2 pr-1">
        <Plus className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">Add a task to {name}</label>
        <input
          id={inputId} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140}
          placeholder={`Add a task to ${name}`}
          className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-faint outline-none border-b border-transparent focus:border-signal"
        />
      </form>
      {error && <p role="alert" className="px-2 text-xs text-danger">{error}</p>}
    </section>
  );
}

function TaskRow({ task, onToggle, showTopic = false }: { task: TaskDTO; onToggle: () => void; showTopic?: boolean }) {
  const done = task.status === 'done';
  const inProgress = task.status === 'in_progress';
  const Icon = done ? CircleCheck : inProgress ? CircleDot : Circle;
  const meta = [inProgress ? 'In progress' : null, showTopic ? task.topicName : null].filter(Boolean).join(' · ');
  return (
    <li className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-raised">
      <button
        onClick={onToggle}
        aria-label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" as done`}
        className="mt-0.5 shrink-0 text-ink-faint hover:text-signal"
      >
        <Icon className={`size-4 ${done || inProgress ? 'text-signal' : ''}`} />
      </button>
      <div className="min-w-0">
        <p className={`text-[13px] leading-5 ${done ? 'text-ink-faint line-through' : 'text-ink'}`}>{task.title}</p>
        {meta && <p className="text-[11px] text-ink-muted">{meta}</p>}
      </div>
    </li>
  );
}
