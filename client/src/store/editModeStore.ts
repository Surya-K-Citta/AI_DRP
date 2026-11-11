import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Where a DPR is filled in. One place at a time, so the two never compete:
 *  - form:     the questions, step by step. The report next to them is a read-only preview.
 *  - document: type straight into the report. The form folds away.
 * The choice is remembered on this device.
 */
export type EditMode = 'form' | 'document';

interface EditModeState {
  mode: EditMode;
  setMode: (mode: EditMode) => void;
}

export const useEditModeStore = create<EditModeState>()(
  persist(
    (set) => ({
      mode: 'form',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'dpr-edit-mode' }
  )
);
