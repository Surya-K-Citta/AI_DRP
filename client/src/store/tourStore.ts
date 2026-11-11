import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The guided tour: whether it is running and which stop it is on. Kept for the browser tab, so it carries on across pages and reloads. */
interface TourState {
  active: boolean;
  step: number;
  start: () => void;
  stop: () => void;
  goTo: (step: number) => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      active: false,
      step: 0,
      start: () => set({ active: true, step: 0 }),
      stop: () => set({ active: false, step: 0 }),
      goTo: (step) => set({ step: Math.max(0, step) }),
    }),
    { name: 'dpr-tour', storage: createJSONStorage(() => sessionStorage) }
  )
);
