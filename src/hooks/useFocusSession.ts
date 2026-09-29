'use client';

import { useEffect, useState } from 'react';
import {
  abandonSessionAction,
  finishSessionAction,
  getActiveSessionAction,
  pauseSessionAction,
  resumeSessionAction,
  startSessionAction,
  type SessionResult,
} from '@/app/actions/sessions';
import { liveFocusedSeconds, progress, remainingSeconds } from '@/lib/session-clock';
import { useFocusStore } from '@/store/useFocusStore';

/**
 * Re-renders once per second while `active`, returning the server-aligned time.
 * Right after a start/resume `now` can be up to a second stale; the clock math
 * clamps that to zero, and the next tick corrects it.
 */
function useServerNow(active: boolean, offsetMs: number): number {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now() + offsetMs), 1000);
    return () => clearInterval(id);
  }, [active, offsetMs]);
  return now;
}

/** Calls a session action and writes the result into the store. Not a hook: safe to call anywhere. */
async function apply(call: () => Promise<SessionResult>, changesHistory = false) {
  const store = useFocusStore.getState();
  store.setPending(true);
  try {
    let res: SessionResult;
    try {
      res = await call();
    } catch {
      // The request itself failed (offline, server restarting). Without this the error
      // was swallowed: the button just stopped doing anything, with no message.
      res = { ok: false, code: 'NETWORK', error: "Couldn't reach the server. Check your connection and try again." };
    }
    if (res.ok) {
      const { session: next, serverNow } = res.data;
      // A finished/abandoned session comes back too; the timer only cares about active ones.
      const active = next && (next.status === 'running' || next.status === 'paused');
      store.setSession(active ? next : null, serverNow);
      if (changesHistory) store.invalidateTracking(); // stats, history and task status changed
    } else {
      store.setError(res.error);
    }
    return res;
  } finally {
    store.setPending(false);
  }
}

/**
 * Loads the active session once, and re-syncs session + tracking whenever the tab
 * becomes visible (another tab or device may have paused or finished it).
 * Call it ONCE, in the workspace shell.
 */
export function useSessionSync() {
  useEffect(() => {
    if (!useFocusStore.getState().hydrated) apply(getActiveSessionAction);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      apply(getActiveSessionAction, true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
}

/** Read the session and control it. Any number of components can use this. */
export function useFocusSession() {
  const session = useFocusStore((s) => s.session);
  const clockOffsetMs = useFocusStore((s) => s.clockOffsetMs);
  const hydrated = useFocusStore((s) => s.hydrated);
  const pending = useFocusStore((s) => s.pending);
  const error = useFocusStore((s) => s.error);

  const now = useServerNow(session?.status === 'running', clockOffsetMs);

  return {
    session,
    hydrated,
    pending,
    error,
    focused: session ? liveFocusedSeconds(session, now) : 0,
    remaining: session ? remainingSeconds(session, now) : null,
    progress: session ? progress(session, now) : 0,
    start: (input: { plannedSeconds: number; taskId?: string | null; topicId?: string | null }) =>
      apply(() => startSessionAction(input), true),
    pause: () => session && apply(() => pauseSessionAction(session.id)),
    resume: () => session && apply(() => resumeSessionAction(session.id)),
    finish: (reflection?: string, markTaskDone?: boolean) =>
      session && apply(() => finishSessionAction(session.id, reflection, markTaskDone), true),
    abandon: () => session && apply(() => abandonSessionAction(session.id), true),
  };
}
