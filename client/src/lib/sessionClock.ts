import { create } from 'zustand';

/** A session ends after this long with no real input. The server's token is a little longer (it adds a short slack). */
export const IDLE_MS = 6 * 60 * 1000;
const SESSION_MS = IDLE_MS;
/** What the countdown counts: the shorter of the idle limit and the token's own length (a short test token ends sooner). */
export const idleWindowMs = (durationMs: number) => Math.min(IDLE_MS, durationMs);
/** Time left before the idle logout, from the last real input. */
export const idleLeftMs = (lastActivityAt: number, durationMs: number, now: number) =>
  lastActivityAt + idleWindowMs(durationMs) - now;
/** Where the last real input time is kept, so a reload (and other tabs) carry on from it instead of starting over. */
export const ACTIVITY_KEY = 'dpr-last-activity';
/** The "still there?" prompt opens this long before the end (a quarter of a short test session). */
export const warnMs = (durationMs: number) => Math.min(60 * 1000, durationMs / 4);
/** While someone is active the token is renewed at most this often (the server's idle check follows the renewals). */
export const refreshAfterMs = (durationMs: number) => Math.min(20 * 1000, durationMs / 4);

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

type SessionPhase = 'active' | 'warning' | 'expired';
type EndReason = 'idle' | 'expired' | 'deactivated' | null;

interface SessionClockState {
  expiresAt: number | null;
  issuedAt: number | null;
  durationMs: number;
  /** When the person last did something (click, key, wheel, touch). The idle countdown runs from here. */
  lastActivityAt: number;
  phase: SessionPhase;
  reason: EndReason;
  /** A fresh sign-in: the token and "just now" as the last activity. */
  startSession: (token: string | null) => void;
  /** Record real input. */
  touch: (at?: number) => void;
  /** A renewed token. It does not count as activity. */
  setToken: (token: string | null) => void;
  setPhase: (phase: SessionPhase) => void;
  markExpired: (reason: EndReason) => void;
  reset: () => void;
}

let lastWrite = 0;
/** Saved at most every 2 seconds (it is only read after a reload or by another tab). */
function writeActivity(at: number) {
  if (at - lastWrite < 2000) return;
  lastWrite = at;
  try {
    localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    /* the countdown still works in this tab */
  }
}

export function readSavedActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export const useSessionClock = create<SessionClockState>()((set) => ({
  expiresAt: null,
  issuedAt: null,
  durationMs: SESSION_MS,
  lastActivityAt: Date.now(),
  phase: 'active',
  reason: null,
  startSession: (token) => {
    const now = Date.now();
    writeActivity(now);
    set({ lastActivityAt: now });
    useSessionClock.getState().setToken(token);
  },
  touch: (at = Date.now()) => {
    set({ lastActivityAt: at });
    writeActivity(at);
  },
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
  reset: () => {
    try {
      localStorage.removeItem(ACTIVITY_KEY);
    } catch {
      /* nothing to clear */
    }
    set({ expiresAt: null, issuedAt: null, phase: 'active', reason: null });
  },
}));

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
