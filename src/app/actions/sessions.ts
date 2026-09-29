'use server';

import { runAction, type ActionResult } from '@/data/run-action';
import {
  databaseNow,
  endSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  startSession,
  type StartInput,
} from '@/data/sessions';
import { markTaskStarted, setTaskStatus } from '@/data/tasks';
import type { SessionDTO } from '@/lib/session-clock';

// Server Actions are public POST endpoints: runAction re-checks the user, then
// the Data Access Layer enforces ownership. Every result carries `serverNow`
// so the browser can correct for a clock that is ahead or behind the server's.

type SessionPayload = { session: SessionDTO | null; serverNow: string };
export type SessionResult = ActionResult<SessionPayload>;

async function withNow(session: SessionDTO | null): Promise<SessionPayload> {
  return { session, serverNow: (await databaseNow()).toISOString() };
}

export async function getActiveSessionAction() {
  return runAction(async (user) => withNow(await getActiveSession(user.id)));
}

export async function startSessionAction(input: StartInput) {
  return runAction(async (user) => {
    const session = await startSession(user.id, input);
    if (session.taskId) await markTaskStarted(user.id, session.taskId);
    return withNow(session);
  });
}

export async function pauseSessionAction(sessionId: string) {
  return runAction(async (user) => withNow(await pauseSession(user.id, sessionId)));
}

export async function resumeSessionAction(sessionId: string) {
  return runAction(async (user) => withNow(await resumeSession(user.id, sessionId)));
}

export async function finishSessionAction(sessionId: string, reflection?: string, markTaskDone?: boolean) {
  return runAction(async (user) => {
    const session = await endSession(user.id, sessionId, 'completed', reflection);
    if (markTaskDone === true && session.taskId) await setTaskStatus(user.id, session.taskId, 'done');
    return withNow(session);
  });
}

export async function abandonSessionAction(sessionId: string) {
  return runAction(async (user) => withNow(await endSession(user.id, sessionId, 'abandoned')));
}
