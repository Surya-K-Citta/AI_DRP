import { create } from 'zustand';

/** Only one microphone button listens at a time. Starting another one stops the first. */
interface VoiceState {
  activeId: string | null;
  setActive: (id: string | null) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  activeId: null,
  setActive: (id) => set({ activeId: id }),
}));
