import { createContext, useContext, type ReactNode } from 'react';

/**
 * Turns on the microphone button for the text boxes inside it. Put it around a form, not around the whole app,
 * so only the places that should take dictation (the DPR forms) show a microphone.
 */
const VoiceContext = createContext(false);

export function VoiceProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  return <VoiceContext.Provider value={enabled}>{children}</VoiceContext.Provider>;
}

export const useVoiceEnabled = () => useContext(VoiceContext);
