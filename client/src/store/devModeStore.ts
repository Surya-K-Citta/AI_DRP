import { create } from 'zustand';

/** Admin-only "Dev mode" (skips required-field checks while building a DPR). Off until switched on. */
interface DevModeState {
  on: boolean;
  setOn: (next: boolean) => void;
}

export const useDevModeStore = create<DevModeState>((set) => ({
  on: false,
  setOn: (next) => set({ on: next }),
}));
