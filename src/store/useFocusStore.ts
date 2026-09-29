import { create } from 'zustand';
import type { HistoryDay, TodayStats } from '@/data/history';
import type { TaskDTO, TopicDTO } from '@/data/tasks';
import type { SessionDTO } from '@/lib/session-clock';

// The timer is not stored as a countdown number. We keep the session exactly as
// the server returned it (timestamps + banked seconds) and compute the time left
// on every render. Nothing to tick, nothing to drift, nothing lost on unmount.
// (Types from @/data are `import type`: erased at build time, so no server code
// reaches the browser.)

export type Tracking = { tasks: TaskDTO[]; topics: TopicDTO[]; today: TodayStats; history: HistoryDay[] };

interface FocusState {
  session: SessionDTO | null;
  /** serverTime − browserTime, in ms. Added to Date.now() so both agree. */
  clockOffsetMs: number;
  hydrated: boolean;
  pending: boolean;
  error: string | null;
  setSession: (session: SessionDTO | null, serverNow: string) => void;
  setPending: (pending: boolean) => void;
  setError: (error: string | null) => void;

  /** Tasks, topics, today's stats and history; reloaded whenever `trackingVersion` changes. */
  tracking: Tracking | null;
  trackingVersion: number;
  setTracking: (tracking: Tracking) => void;
  invalidateTracking: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  session: null,
  clockOffsetMs: 0,
  hydrated: false,
  pending: false,
  error: null,
  setSession: (session, serverNow) =>
    set({ session, clockOffsetMs: Date.parse(serverNow) - Date.now(), hydrated: true, error: null }),
  setPending: (pending) => set({ pending }),
  setError: (error) => set({ error, hydrated: true }),

  tracking: null,
  trackingVersion: 0,
  setTracking: (tracking) => set({ tracking }),
  invalidateTracking: () => set((s) => ({ trackingVersion: s.trackingVersion + 1 })),
}));
