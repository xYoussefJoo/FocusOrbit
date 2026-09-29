import 'server-only';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tasks, topics } from '@/db/schema';
import { SessionError } from './sessions';

// Tasks ("what I planned") and topics ("what I studied"). Same rules as the
// sessions DAL: every query is scoped by userId, ids from the client are
// validated and ownership is checked.

export type TaskDTO = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  topicId: string | null;
  topicName: string | null;
};
export type TopicDTO = { id: string; name: string; color: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ['todo', 'in_progress', 'done'] as const;

function cleanText(value: unknown, field: string, max: number): string {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!text) throw new SessionError('INVALID_INPUT', `${field} can't be empty`);
  if (text.length > max) throw new SessionError('INVALID_INPUT', `${field} is limited to ${max} characters`);
  return text;
}

async function assertOwnedTopic(userId: string, topicId: unknown) {
  if (topicId == null) return null;
  if (typeof topicId !== 'string' || !UUID.test(topicId)) throw new SessionError('INVALID_INPUT', 'topicId must be a valid id');
  const [row] = await db.select({ id: topics.id }).from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId))).limit(1);
  if (!row) throw new SessionError('NOT_FOUND', 'Topic not found');
  return topicId;
}

// ─── Topics ─────────────────────────────────────────────────────────────────

export async function listTopics(userId: string): Promise<TopicDTO[]> {
  return db.select({ id: topics.id, name: topics.name, color: topics.color }).from(topics)
    .where(and(eq(topics.userId, userId), isNull(topics.archivedAt)))
    .orderBy(asc(topics.name));
}

/** Creates a topic, or returns the existing one with the same name (names are unique per user). */
export async function createTopic(userId: string, name: unknown): Promise<TopicDTO> {
  const clean = cleanText(name, 'Topic name', 60);
  const [row] = await db.insert(topics).values({ userId, name: clean })
    .onConflictDoUpdate({ target: [topics.userId, topics.name], set: { archivedAt: null } })
    .returning({ id: topics.id, name: topics.name, color: topics.color });
  return row;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

/** Open tasks first (in progress, then to-do), then the 20 most recently finished. */
export async function listTasks(userId: string): Promise<TaskDTO[]> {
  const rows = await db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status, topicId: tasks.topicId, topicName: topics.name })
    .from(tasks)
    .leftJoin(topics, eq(topics.id, tasks.topicId))
    .where(eq(tasks.userId, userId))
    .orderBy(
      sql`case ${tasks.status} when 'in_progress' then 0 when 'todo' then 1 else 2 end`,
      desc(sql`coalesce(${tasks.completedAt}, ${tasks.createdAt})`),
    )
    .limit(200);
  const open = rows.filter((t) => t.status !== 'done');
  const done = rows.filter((t) => t.status === 'done').slice(0, 20);
  return [...open, ...done];
}

export async function createTask(userId: string, input: { title: unknown; topicId?: unknown }): Promise<TaskDTO> {
  const title = cleanText(input?.title, 'Task title', 140);
  const topicId = await assertOwnedTopic(userId, input?.topicId ?? null);
  const [row] = await db.insert(tasks).values({ userId, title, topicId }).returning();
  const topicName = topicId
    ? (await db.select({ name: topics.name }).from(topics).where(eq(topics.id, topicId)))[0]?.name ?? null
    : null;
  return { id: row.id, title: row.title, status: row.status, topicId: row.topicId, topicName };
}

export async function setTaskStatus(userId: string, taskId: unknown, status: unknown): Promise<void> {
  if (typeof taskId !== 'string' || !UUID.test(taskId)) throw new SessionError('INVALID_INPUT', 'taskId must be a valid id');
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new SessionError('INVALID_INPUT', 'Unknown task status');
  const next = status as (typeof STATUSES)[number];
  const [row] = await db.update(tasks)
    .set({ status: next, completedAt: next === 'done' ? sql`now()` : null })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  if (!row) throw new SessionError('NOT_FOUND', 'Task not found');
}

/** Starting a session on a to-do task moves it to "in progress" (never downgrades a done task). */
export async function markTaskStarted(userId: string, taskId: string): Promise<void> {
  await db.update(tasks).set({ status: 'in_progress' })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), eq(tasks.status, 'todo')));
}
