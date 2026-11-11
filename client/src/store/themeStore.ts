import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** The person's choice, light unless they switch to dark. Remembered in this browser. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-mode',
      version: 1,
      // An earlier build also had "system"; anything that is not dark is light.
      migrate: (persisted: any) => ({ mode: persisted?.mode === 'dark' ? 'dark' : 'light' }),
    }
  )
);
