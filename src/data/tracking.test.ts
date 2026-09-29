// Integration tests for tasks, topics, history and today's stats. Run: npm test
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import '@/test/load-env'; // must stay above '@/db', which reads DATABASE_URL on import
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { focusSessions, tasks, users } from '@/db/schema';
import { getHistory, getTodayStats } from './history';
import { endSession, SessionError, startSession } from './sessions';
import { createTask, createTopic, listTasks, markTaskStarted, setTaskStatus } from './tasks';

const CARA = 'test_cara';
const DAN = 'test_dan';
const TZ = 'Africa/Cairo';

async function rejectsWith(p: Promise<unknown>, code: string) {
  await assert.rejects(p, (err: unknown) => err instanceof SessionError && err.code === code);
}

/** A finished session that started `daysAgo` days ago and lasted `minutes`. */
async function pastSession(userId: string, daysAgo: number, minutes: number, status: 'completed' | 'abandoned' = 'completed') {
  await db.insert(focusSessions).values({
    userId,
    status,
    plannedSeconds: minutes * 60,
    focusedSeconds: minutes * 60,
    startedAt: sql`now() - make_interval(days => ${daysAgo})`,
    lastResumedAt: null,
    endedAt: sql`now() - make_interval(days => ${daysAgo}) + make_interval(mins => ${minutes})`,
  });
}

before(async () => {
  await db.delete(users).where(inArray(users.id, [CARA, DAN]));
  await db.insert(users).values([
    { id: CARA, name: 'Cara', email: 'cara@test.invalid', timezone: TZ },
    { id: DAN, name: 'Dan', email: 'dan@test.invalid' },
  ]);
});

after(async () => {
  await db.delete(users).where(inArray(users.id, [CARA, DAN]));
  await (globalThis as unknown as { pgClient?: { end(): Promise<void> } }).pgClient?.end();
});

test('topics: names are unique per user, creating twice returns the same topic', async () => {
  const a = await createTopic(CARA, '  PostgreSQL ');
  const b = await createTopic(CARA, 'PostgreSQL');
  assert.equal(a.id, b.id);
  assert.equal(a.name, 'PostgreSQL', 'whitespace is trimmed');
  await rejectsWith(createTopic(CARA, '   '), 'INVALID_INPUT');
});

test('task lifecycle: todo → in progress (session start) → done (wrap-up)', async () => {
  const topic = await createTopic(CARA, 'Clean Architecture');
  const task = await createTask(CARA, { title: 'Write the DAL', topicId: topic.id });
  assert.equal(task.status, 'todo');
  assert.equal(task.topicName, 'Clean Architecture');

  await markTaskStarted(CARA, task.id);
  assert.equal((await listTasks(CARA)).find((t) => t.id === task.id)?.status, 'in_progress');

  await setTaskStatus(CARA, task.id, 'done');
  const [row] = await db.select().from(tasks).where(eq(tasks.id, task.id));
  assert.equal(row.status, 'done');
  assert.ok(row.completedAt, 'completedAt is set');

  await markTaskStarted(CARA, task.id); // must not downgrade a finished task
  assert.equal((await db.select().from(tasks).where(eq(tasks.id, task.id)))[0].status, 'done');
});

test("authorization: you can't use or change another user's task or topic", async () => {
  const caraTopic = await createTopic(CARA, 'Private topic');
  const caraTask = await createTask(CARA, { title: 'Private task' });
  await rejectsWith(setTaskStatus(DAN, caraTask.id, 'done'), 'NOT_FOUND');
  await rejectsWith(createTask(DAN, { title: 'Sneaky', topicId: caraTopic.id }), 'NOT_FOUND');
  assert.equal((await listTasks(DAN)).length, 0, "Dan sees none of Cara's tasks");
});

test('history groups finished sessions by local day, newest first, and skips active ones', async () => {
  await pastSession(CARA, 2, 50);
  await pastSession(CARA, 1, 25);
  await pastSession(CARA, 1, 10, 'abandoned');
  const active = await startSession(CARA, { plannedSeconds: 1500 });

  const history = await getHistory(CARA, TZ);
  assert.equal(history.length, 2, 'two distinct days');
  assert.ok(history[0].day > history[1].day, 'newest day first');
  assert.equal(history[0].sessions.length, 2);
  assert.equal(history[0].totalSeconds, 35 * 60, 'abandoned time still counts as time spent');
  assert.ok(!history.flatMap((d) => d.sessions).some((s) => s.id === active.id), 'active session excluded');

  await endSession(CARA, active.id, 'abandoned');
});

test("today's stats and streak", async () => {
  await db.delete(focusSessions).where(eq(focusSessions.userId, DAN));
  let stats = await getTodayStats(DAN, 'UTC', 120);
  assert.deepEqual([stats.focusedSeconds, stats.sessionsCompleted, stats.streakDays], [0, 0, 0]);
  assert.equal(stats.goalSeconds, 7200);

  await pastSession(DAN, 2, 30);
  await pastSession(DAN, 1, 30);
  stats = await getTodayStats(DAN, 'UTC', 120);
  assert.equal(stats.streakDays, 2, "yesterday + the day before: alive even though today isn't done yet");

  await pastSession(DAN, 0, 45);
  stats = await getTodayStats(DAN, 'UTC', 120);
  assert.equal(stats.streakDays, 3);
  assert.equal(stats.focusedSeconds, 45 * 60);
  assert.equal(stats.sessionsCompleted, 1);
});

test('an invalid timezone falls back to UTC instead of crashing the query', async () => {
  const stats = await getTodayStats(DAN, "Mars/Olympus'; drop table users; --", 120);
  assert.match(stats.today, /^\d{4}-\d{2}-\d{2}$/);
});
