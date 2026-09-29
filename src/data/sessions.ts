import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { focusSessions, tasks, topics, type FocusSession } from '@/db/schema';
import {
  MAX_PLANNED_SECONDS,
  MIN_PLANNED_SECONDS,
  type SessionDTO,
} from '@/lib/session-clock';

// Data Access Layer for focus sessions.
//
// Every function takes the *authenticated* userId (resolved by the caller via
// requireUserId) and scopes every query by it. That is the authorization rule:
// you can only ever see or change your own sessions.
//
// State changes are single UPDATE statements guarded by the current status
// (e.g. pause only WHERE status = 'running'). The database's clock, now(), is
// the only clock used — so two tabs or a slow network can't corrupt the timer.

export class SessionError extends Error {
  constructor(
    // CONFLICT: someone else (another tab or device) changed it first; used by files.
    // RUNNER_UNAVAILABLE: the code-runner container is down or lacks the language.
    public code: 'ALREADY_ACTIVE' | 'NOT_FOUND' | 'INVALID_STATE' | 'INVALID_INPUT' | 'CONFLICT' | 'RUNNER_UNAVAILABLE',
    message: string,
  ) {
    super(message);
  }
}

const ACTIVE = ['running', 'paused'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Seconds since the last resume, computed inside Postgres.
const runningStretch = sql<number>`greatest(0, floor(extract(epoch from (now() - ${focusSessions.lastResumedAt}))))::int`;

// Banked time after adding the current stretch, never more than the planned time.
// The browser pauses at "time's up", but only while the tab is open: a session left
// running (tab closed, laptop asleep) would otherwise bank hours of "focus" on return.
const bankedWithStretch = sql<number>`least(${focusSessions.plannedSeconds}, ${focusSessions.focusedSeconds} + ${runningStretch})`;

function toDTO(s: FocusSession): SessionDTO {
  return {
    id: s.id,
    status: s.status,
    plannedSeconds: s.plannedSeconds,
    focusedSeconds: s.focusedSeconds,
    lastResumedAt: s.lastResumedAt?.toISOString() ?? null,
    startedAt: s.startedAt.toISOString(),
    topicId: s.topicId,
    taskId: s.taskId,
  };
}

export function assertUuid(id: unknown, field: string): asserts id is string {
  if (typeof id !== 'string' || !UUID.test(id)) {
    throw new SessionError('INVALID_INPUT', `${field} must be a valid id`);
  }
}

export function isUniqueViolation(err: unknown): boolean {
  // Drizzle wraps driver errors; the Postgres error code lives on the cause.
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

// ─── Reads ──────────────────────────────────────────────────────────────────

export async function getActiveSession(userId: string): Promise<SessionDTO | null> {
  const [row] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.userId, userId), inArray(focusSessions.status, ACTIVE)))
    .limit(1);
  return row ? toDTO(row) : null;
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export type StartInput = {
  plannedSeconds: number;
  topicId?: string | null;
  taskId?: string | null;
};

export async function startSession(userId: string, input: StartInput): Promise<SessionDTO> {
  const plannedSeconds = input?.plannedSeconds;
  if (
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < MIN_PLANNED_SECONDS ||
    plannedSeconds > MAX_PLANNED_SECONDS
  ) {
    throw new SessionError('INVALID_INPUT', 'Planned time must be between 1 minute and 4 hours');
  }

  // Authorization: a topic/task id from the client must belong to this user.
  const topicId = input?.topicId ?? null;
  const taskId = input?.taskId ?? null;
  if (topicId) {
    assertUuid(topicId, 'topicId');
    const owned = await db.select({ id: topics.id }).from(topics)
      .where(and(eq(topics.id, topicId), eq(topics.userId, userId))).limit(1);
    if (!owned.length) throw new SessionError('NOT_FOUND', 'Topic not found');
  }
  if (taskId) {
    assertUuid(taskId, 'taskId');
    const owned = await db.select({ id: tasks.id }).from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1);
    if (!owned.length) throw new SessionError('NOT_FOUND', 'Task not found');
  }

  try {
    const [row] = await db
      .insert(focusSessions)
      .values({ userId, plannedSeconds, topicId, taskId })
      .returning();
    return toDTO(row);
  } catch (err) {
    // The partial unique index is the real guard against two active sessions.
    if (isUniqueViolation(err)) {
      throw new SessionError('ALREADY_ACTIVE', 'You already have an active session');
    }
    throw err;
  }
}

export async function pauseSession(userId: string, sessionId: string): Promise<SessionDTO> {
  assertUuid(sessionId, 'sessionId');
  const [row] = await db
    .update(focusSessions)
    .set({
      status: 'paused',
      focusedSeconds: bankedWithStretch,
      lastResumedAt: null,
    })
    .where(and(
      eq(focusSessions.id, sessionId),
      eq(focusSessions.userId, userId),
      eq(focusSessions.status, 'running'),
    ))
    .returning();
  if (!row) throw new SessionError('INVALID_STATE', 'Only a running session can be paused');
  return toDTO(row);
}

export async function resumeSession(userId: string, sessionId: string): Promise<SessionDTO> {
  assertUuid(sessionId, 'sessionId');
  const [row] = await db
    .update(focusSessions)
    .set({ status: 'running', lastResumedAt: sql`now()` })
    .where(and(
      eq(focusSessions.id, sessionId),
      eq(focusSessions.userId, userId),
      eq(focusSessions.status, 'paused'),
    ))
    .returning();
  if (!row) throw new SessionError('INVALID_STATE', 'Only a paused session can be resumed');
  return toDTO(row);
}

/** Ends an active session. `completed` keeps it in history; `abandoned` marks it as given up. */
export async function endSession(
  userId: string,
  sessionId: string,
  outcome: 'completed' | 'abandoned',
  reflection?: string | null,
): Promise<SessionDTO> {
  assertUuid(sessionId, 'sessionId');
  const note = reflection?.trim() || null;
  if (note && note.length > 2000) {
    throw new SessionError('INVALID_INPUT', 'Reflection is limited to 2000 characters');
  }
  const [row] = await db
    .update(focusSessions)
    .set({
      status: outcome,
      // Bank the current stretch if it was running; a paused session has nothing to add.
      focusedSeconds: sql`case when ${focusSessions.lastResumedAt} is null then ${focusSessions.focusedSeconds} else ${bankedWithStretch} end`,
      lastResumedAt: null,
      endedAt: sql`now()`,
      reflection: note,
    })
    .where(and(
      eq(focusSessions.id, sessionId),
      eq(focusSessions.userId, userId),
      inArray(focusSessions.status, ACTIVE),
    ))
    .returning();
  if (!row) throw new SessionError('INVALID_STATE', 'This session has already ended');
  return toDTO(row);
}

/** The database clock. Session timestamps come from it, so the browser syncs to it too. */
export async function databaseNow(): Promise<Date> {
  const [row] = await db.execute<{ now: Date | string }>(sql`select now() as now`);
  return new Date(row.now);
}
