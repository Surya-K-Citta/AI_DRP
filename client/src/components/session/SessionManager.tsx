import { ModalFocus } from '@/components/ui/ModalFocus';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { flushPendingDraft } from '@/lib/draftFlush';
import { backUpOpenDraft, clearBackup, takeBackup } from '@/lib/sessionBackup';
import { individualDprApi } from '@/lib/individualDpr/individualDprApi';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_KEY, formatClock, idleLeftMs, readSavedActivity, refreshAfterMs, tokenTimes, useSessionClock, warnMs } from '@/lib/sessionClock';

// Only things a person does count as activity. A `scroll` event is left out on purpose: the browser fires it by itself when a
// page reloads and restores its scroll position, and when the app scrolls (new screen, step strip, smooth scrolling), and
// that would silently restart the 6 minutes. Scrolling by hand is still caught by wheel, touch, keys and pointer.
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Keeps the session alive while someone works and warns a minute before it ends. After 6 minutes without activity (or at
 * the session limit) it signs the person out and opens the login screen with a note saying why. A draft with unsaved
 * changes is saved if possible, otherwise kept on this device and put back at the next sign-in by the same person.
 */
export const SessionManager: React.FC = () => {
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const phase = useSessionClock((s) => s.phase);
  const reason = useSessionClock((s) => s.reason);
  const expiresAt = useSessionClock((s) => s.expiresAt);
  const durationMs = useSessionClock((s) => s.durationMs);
  const lastActivityAt = useSessionClock((s) => s.lastActivityAt);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const lastActive = useRef(Date.now());
  const flushedForToken = useRef<number | null>(null);
  const signedIn = Boolean(isAuthenticated && token && user);

  // Start the clock from a token that was saved before a reload, carrying on from the last real input (not starting over).
  // If that token has already run out, the server decides whether the session is still within its idle window.
  useEffect(() => {
    if (!token || useSessionClock.getState().expiresAt) return;
    const times = tokenTimes(token);
    useSessionClock.setState({ lastActivityAt: Math.max(readSavedActivity() ?? 0, times?.issuedAt ?? 0) || Date.now() });
    if (times && times.expiresAt <= Date.now()) {
      void api.refreshSession();
    } else {
      useSessionClock.getState().setToken(token);
    }
  }, [token]);

  // Other tabs renew the token too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'token' && event.newValue) {
        useAuthStore.setState({ token: event.newValue });
        useSessionClock.getState().setToken(event.newValue);
      }
      // Input in another tab counts as activity here too.
      if (event.key === ACTIVITY_KEY && event.newValue) {
        const at = Number(event.newValue);
        if (Number.isFinite(at)) useSessionClock.setState((state) => ({ lastActivityAt: Math.max(state.lastActivityAt, at) }));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const renew = useCallback(async () => {
    if (useSessionClock.getState().phase === 'expired') return;
    await api.refreshSession();
  }, []);

  // Any activity keeps the session going. The token is renewed at most about once a minute.
  useEffect(() => {
    if (!signedIn) return undefined;
    const onActivity = (event: Event) => {
      if (!event.isTrusted) return; // a script, not a person
      lastActive.current = Date.now();
      useSessionClock.getState().touch(); // the countdown starts over at once
      const { issuedAt: issued, phase: current, durationMs: span } = useSessionClock.getState();
      // The token is renewed in the background so the server's own idle check keeps up (at most every few seconds).
      if (current !== 'expired' && issued && Date.now() - issued > refreshAfterMs(span)) void renew();
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true, capture: true }));
    return () => ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity, { capture: true } as any));
  }, [signedIn, renew]);

  useEffect(() => {
    if (!signedIn) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [signedIn]);

  // Warn a minute before the end (saving the draft while the token still works), then end the session.
  useEffect(() => {
    if (!signedIn || !expiresAt || phase === 'expired') return;
    const left = idleLeftMs(lastActivityAt, durationMs, now);
    if (left <= 0) {
      useSessionClock.getState().markExpired('idle');
      return;
    }
    if (left <= warnMs(durationMs)) {
      if (phase !== 'warning') useSessionClock.getState().setPhase('warning');
      if (flushedForToken.current !== lastActivityAt) {
        flushedForToken.current = lastActivityAt;
        void flushPendingDraft();
      }
    } else if (phase === 'warning') {
      useSessionClock.getState().setPhase('active');
    }
  }, [now, expiresAt, lastActivityAt, phase, signedIn, user?.userId, durationMs]);

  // The session is over (6 minutes without activity, or the 8 hour limit, or the account was switched off): save what can be
  // saved, keep a copy of any unsaved draft on this device for the next sign-in, sign out, and go to the login screen.
  const leaving = useRef(false);
  useEffect(() => {
    if (phase !== 'expired' || !signedIn || leaving.current) return;
    leaving.current = true;
    const ended = reason;
    const who = user?.userId;
    void (async () => {
      try {
        const result = await flushPendingDraft();
        if (result.dirty && !result.ok) backUpOpenDraft(who);
      } catch {
        backUpOpenDraft(who);
      }
      try {
        await api.logout(); // works without a valid token: it only needs the session cookie
      } catch {
        /* the server end is revoked by expiry anyway */
      }
      logout();
      navigate('/login', { replace: true, state: { sessionEnded: ended || 'expired' } });
      leaving.current = false;
    })();
  }, [phase, reason, signedIn, user?.userId, logout, navigate]);

  // After signing in again, put back a draft that could not be saved when the last session ended.
  useEffect(() => {
    if (!signedIn || phase === 'expired') return;
    const backup = takeBackup(user?.userId);
    if (!backup) return;
    void (async () => {
      try {
        await individualDprApi.saveDraft(backup.payload as any);
        clearBackup();
        toast.success(tf('Your unsaved draft from the last session was restored.'));
      } catch {
        /* kept on this device; tried again next time */
      }
    })();
  }, [signedIn, phase, user?.userId, tf]);

  const stayIn = async () => {
    setBusy(true);
    lastActive.current = Date.now();
    await renew();
    setBusy(false);
  };

  if (!signedIn) return null;
  const left = expiresAt ? Math.max(0, idleLeftMs(lastActivityAt, durationMs, now)) : 0;

  // When the session ends the effect above signs out and opens the login screen, so there is nothing to draw here.
  if (phase === 'expired') return null;

  if (phase === 'warning') {
    return (
      <ModalFocus>
      <div className="motion-overlay fixed inset-0 z-[190] flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="warn-title">
        <div className="w-full max-w-sm space-y-4 rounded-xl border border-amber-300 bg-background p-6 shadow-xl">
          <h2 id="warn-title" className="text-lg font-semibold">{tf('Are you still there?')}</h2>
          <p className="text-sm text-muted-foreground">
            {tf('You will be signed out in {time} because there has been no activity. Your draft is being saved.').replace('{time}', formatClock(left))}
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => void stayIn()} disabled={busy}>
              {tf('Stay signed in')}
            </Button>
          </div>
        </div>
      </div>
      </ModalFocus>
    );
  }

  return null;
};
