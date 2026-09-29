// Pure timer math shared by the server and the browser. No I/O, no Date.now()
// inside — the caller passes `nowMs`, which makes every function easy to test.

export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned';

/** The only session shape that ever leaves the server. */
export type SessionDTO = {
  id: string;
  status: SessionStatus;
  plannedSeconds: number;
  focusedSeconds: number; // banked time, excluding the current running stretch
  lastResumedAt: string | null; // ISO; set only while running
  startedAt: string; // ISO
  topicId: string | null;
  taskId: string | null;
};

export const MIN_PLANNED_SECONDS = 60;
export const MAX_PLANNED_SECONDS = 4 * 60 * 60;

/** Total focused time at `nowMs`: banked seconds + the stretch since the last resume. */
export function liveFocusedSeconds(s: SessionDTO, nowMs: number): number {
  if (s.status !== 'running' || !s.lastResumedAt) return s.focusedSeconds;
  const stretch = Math.floor((nowMs - Date.parse(s.lastResumedAt)) / 1000);
  return s.focusedSeconds + Math.max(0, stretch);
}

/** Seconds left until the planned time is reached (never negative). */
export function remainingSeconds(s: SessionDTO, nowMs: number): number {
  return Math.max(0, s.plannedSeconds - liveFocusedSeconds(s, nowMs));
}

/** 0 → 1 progress through the planned time. */
export function progress(s: SessionDTO, nowMs: number): number {
  return Math.min(1, liveFocusedSeconds(s, nowMs) / s.plannedSeconds);
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
