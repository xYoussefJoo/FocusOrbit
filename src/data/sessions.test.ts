// Integration tests against the real Docker Postgres. Run: npm test
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import '@/test/load-env'; // must stay above '@/db', which reads DATABASE_URL on import
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { focusSessions, topics, users } from '@/db/schema';
import * as S from './sessions';

const ALICE = 'test_alice';
const BOB = 'test_bob';

async function rejectsWith(p: Promise<unknown>, code: string) {
  await assert.rejects(p, (err: unknown) => err instanceof S.SessionError && err.code === code);
}

/** Pretend the current running stretch began `seconds` ago. */
async function rewind(sessionId: string, seconds: number) {
  await db.update(focusSessions)
    .set({ lastResumedAt: sql`now() - make_interval(secs => ${seconds})` })
    .where(eq(focusSessions.id, sessionId));
}

before(async () => {
  await db.delete(users).where(inArray(users.id, [ALICE, BOB]));
  // In the app, Better Auth creates these rows at sign-up.
  await db.insert(users).values([
    { id: ALICE, name: 'Alice', email: 'alice@test.invalid' },
    { id: BOB, name: 'Bob', email: 'bob@test.invalid' },
  ]);
});

after(async () => {
  await db.delete(users).where(inArray(users.id, [ALICE, BOB])); // cascades
  await (globalThis as unknown as { pgClient?: { end(): Promise<void> } }).pgClient?.end();
});

test('full lifecycle: start → pause → resume → finish', async () => {
  const s = await S.startSession(ALICE, { plannedSeconds: 1500 });
  assert.equal(s.status, 'running');
  assert.equal(s.focusedSeconds, 0);
  assert.ok(s.lastResumedAt);

  await rewind(s.id, 90);
  const paused = await S.pauseSession(ALICE, s.id);
  assert.equal(paused.status, 'paused');
  assert.equal(paused.focusedSeconds, 90);
  assert.equal(paused.lastResumedAt, null);

  const resumed = await S.resumeSession(ALICE, s.id);
  assert.equal(resumed.status, 'running');
  assert.equal(resumed.focusedSeconds, 90, 'resume must not change banked time');

  await rewind(s.id, 30);
  const done = await S.endSession(ALICE, s.id, 'completed', '  Learned partial indexes  ');
  assert.equal(done.status, 'completed');
  assert.equal(done.focusedSeconds, 120);
  assert.equal(done.lastResumedAt, null);

  const [row] = await db.select().from(focusSessions).where(eq(focusSessions.id, s.id));
  assert.ok(row.endedAt);
  assert.equal(row.reflection, 'Learned partial indexes');
});

test('only one active session per user', async () => {
  const s = await S.startSession(ALICE, { plannedSeconds: 600 });
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 600 }), 'ALREADY_ACTIVE');
  assert.equal((await S.getActiveSession(ALICE))?.id, s.id);

  // Another user is unaffected.
  const b = await S.startSession(BOB, { plannedSeconds: 600 });
  await S.endSession(BOB, b.id, 'abandoned');

  // Ending frees the slot.
  const ended = await S.endSession(ALICE, s.id, 'abandoned');
  assert.equal(ended.status, 'abandoned');
  assert.equal(await S.getActiveSession(ALICE), null);
});

test('invalid transitions are rejected', async () => {
  const s = await S.startSession(ALICE, { plannedSeconds: 600 });
  await rejectsWith(S.resumeSession(ALICE, s.id), 'INVALID_STATE'); // already running
  await S.pauseSession(ALICE, s.id);
  await rejectsWith(S.pauseSession(ALICE, s.id), 'INVALID_STATE'); // already paused
  await S.endSession(ALICE, s.id, 'completed');
  await rejectsWith(S.endSession(ALICE, s.id, 'completed'), 'INVALID_STATE'); // already ended
  await rejectsWith(S.resumeSession(ALICE, s.id), 'INVALID_STATE');
});

test('finishing a paused session adds nothing extra', async () => {
  const s = await S.startSession(ALICE, { plannedSeconds: 600 });
  await rewind(s.id, 40);
  await S.pauseSession(ALICE, s.id);
  const done = await S.endSession(ALICE, s.id, 'completed');
  assert.equal(done.focusedSeconds, 40);
});

test("authorization: you can't touch another user's session or topic", async () => {
  const s = await S.startSession(ALICE, { plannedSeconds: 600 });
  await rejectsWith(S.pauseSession(BOB, s.id), 'INVALID_STATE');
  await rejectsWith(S.endSession(BOB, s.id, 'completed'), 'INVALID_STATE');
  assert.equal((await S.getActiveSession(ALICE))?.status, 'running', "Bob's attempts changed nothing");
  await S.endSession(ALICE, s.id, 'abandoned');

  const [bobTopic] = await db.insert(topics).values({ userId: BOB, name: 'Private' }).returning();
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 600, topicId: bobTopic.id }), 'NOT_FOUND');
});

test('input validation', async () => {
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 10 }), 'INVALID_INPUT');
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 5 * 3600 }), 'INVALID_INPUT');
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 90.5 }), 'INVALID_INPUT');
  await rejectsWith(S.startSession(ALICE, { plannedSeconds: 600, topicId: 'not-a-uuid' }), 'INVALID_INPUT');
  await rejectsWith(S.pauseSession(ALICE, "'; drop table users; --"), 'INVALID_INPUT');
  await rejectsWith(S.startSession(ALICE, null as unknown as S.StartInput), 'INVALID_INPUT');
});

test('databaseNow returns the DB clock', async () => {
  const now = await S.databaseNow();
  assert.ok(Math.abs(now.getTime() - Date.now()) < 5 * 60_000, 'DB and Node clocks within 5 minutes');
});
