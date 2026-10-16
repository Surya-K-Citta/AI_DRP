import { create } from 'zustand';

/** Access tokens last 15 minutes; the server also ends a session after 15 minutes without activity. */
export const SESSION_MS = 15 * 60 * 1000;
/** The "still there?" prompt opens this long before the end (a quarter of a short test session). */
export const warnMs = (durationMs: number) => Math.min(60 * 1000, durationMs / 4);
/** While someone is active the token is renewed at most this often, so the clock stays close to a full 15:00. */
export const refreshAfterMs = (durationMs: number) => Math.min(60 * 1000, durationMs / 4);

export function tokenTimes(token: string | null | undefined): { issuedAt: number; expiresAt: number } | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { iat?: number; exp?: number };
    if (!claims.exp) return null;
    return { issuedAt: (claims.iat ?? claims.exp - SESSION_MS / 1000) * 1000, expiresAt: claims.exp * 1000 };
  } catch {
    return null;
  }
}

export type SessionPhase = 'active' | 'warning' | 'expired';
export type EndReason = 'idle' | 'expired' | 'deactivated' | null;

interface SessionClockState {
  expiresAt: number | null;
  issuedAt: number | null;
  durationMs: number;
  phase: SessionPhase;
  reason: EndReason;
  setToken: (token: string | null) => void;
  setPhase: (phase: SessionPhase) => void;
  markExpired: (reason: EndReason) => void;
  reset: () => void;
}

export const useSessionClock = create<SessionClockState>()((set) => ({
  expiresAt: null,
  issuedAt: null,
  durationMs: SESSION_MS,
  phase: 'active',
  reason: null,
  setToken: (token) => {
    const times = tokenTimes(token);
    set({
      expiresAt: times?.expiresAt ?? null,
      issuedAt: times?.issuedAt ?? null,
      durationMs: times ? times.expiresAt - times.issuedAt : SESSION_MS,
      phase: 'active',
      reason: null,
    });
  },
  setPhase: (phase) => set((state) => (state.phase === 'expired' ? state : { phase })),
  markExpired: (reason) => set({ phase: 'expired', reason }),
  reset: () => set({ expiresAt: null, issuedAt: null, phase: 'active', reason: null }),
}));

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
