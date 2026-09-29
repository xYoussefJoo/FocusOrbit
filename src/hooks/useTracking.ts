'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createTaskAction,
  createTopicAction,
  getTrackingAction,
  setTaskStatusAction,
} from '@/app/actions/tracking';
import { useFocusStore } from '@/store/useFocusStore';

/**
 * Tasks, topics, today's stats and history. The data lives in the store so every
 * panel shares one copy; it reloads whenever `trackingVersion` is bumped (a
 * session ended, a task was added …). Several components can use this hook: only
 * the first one to see a new version fetches.
 */
let requestedVersion = -1;

export function useTracking() {
  const tracking = useFocusStore((s) => s.tracking);
  const version = useFocusStore((s) => s.trackingVersion);
  const setTracking = useFocusStore((s) => s.setTracking);
  const invalidate = useFocusStore((s) => s.invalidateTracking);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestedVersion === version) return;
    requestedVersion = version;
    getTrackingAction()
      .catch(() => ({ ok: false, error: "Couldn't reach the server. Check your connection and try again." }) as const)
      .then((res) => {
        // A newer version was requested meanwhile: this answer is stale, drop it.
        if (requestedVersion !== version) return;
        if (res.ok) {
          setTracking(res.data);
          setError(null);
        } else {
          setError(res.error);
          // Allow a retry: the next invalidate (e.g. when the tab regains focus) reloads.
          requestedVersion = -1;
        }
      });
  }, [version, setTracking]);

  /** Runs a mutation; on success reloads everything, on failure returns the message. */
  const mutate = useCallback(
    async <T,>(call: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>) => {
      const res = await call();
      if (!res.ok) return { error: res.error } as const;
      invalidate();
      return { data: res.data } as const;
    },
    [invalidate],
  );

  return {
    tracking,
    error,
    createTask: (title: string, topicId?: string | null) => mutate(() => createTaskAction({ title, topicId })),
    setTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') =>
      mutate(() => setTaskStatusAction(taskId, status)),
    createTopic: (name: string) => mutate(() => createTopicAction(name)),
  };
}
