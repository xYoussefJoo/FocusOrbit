import { create } from 'zustand';

interface FocusState {
  currentView: 'dashboard' | 'ide';
  isDeepFocus: boolean;
  pomodoroTime: number; // in seconds
  isTimerRunning: boolean;
  progressPercentage: number;
  setCurrentView: (view: 'dashboard' | 'ide') => void;
  toggleDeepFocus: () => void;
  setDeepFocus: (val: boolean) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setProgress: (val: number) => void;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  currentView: 'dashboard',
  isDeepFocus: false,
  pomodoroTime: 25 * 60,
  isTimerRunning: false,
  progressPercentage: 65, // Starting at 65% for demo visual
  
  setCurrentView: (view) => set({ currentView: view }),
  toggleDeepFocus: () => set((state) => ({ isDeepFocus: !state.isDeepFocus })),
  setDeepFocus: (val) => set({ isDeepFocus: val }),
  
  startTimer: () => set({ isTimerRunning: true }),
  pauseTimer: () => set({ isTimerRunning: false }),
  resetTimer: () => set({ pomodoroTime: 25 * 60, isTimerRunning: false }),
  tickTimer: () => set((state) => {
    if (state.pomodoroTime > 0 && state.isTimerRunning) {
      return { pomodoroTime: state.pomodoroTime - 1 };
    }
    return { isTimerRunning: false };
  }),
  setProgress: (val) => set({ progressPercentage: val }),
}));

