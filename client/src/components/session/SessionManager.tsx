import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Clock, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { flushPendingDraft } from '@/lib/draftFlush';
import { backUpOpenDraft, clearBackup, takeBackup } from '@/lib/sessionBackup';
import { individualDprApi } from '@/lib/individualDpr/individualDprApi';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatClock, refreshAfterMs, tokenTimes, useSessionClock, warnMs } from '@/lib/sessionClock';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/**
 * Keeps the session alive while someone works, warns a minute before it ends, and when it does end shows a
 * sign-in prompt over the page (so what is on screen is kept) instead of throwing the person away.
 */
export const SessionManager: React.FC = () => {
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  const phase = useSessionClock((s) => s.phase);
  const reason = useSessionClock((s) => s.reason);
  const expiresAt = useSessionClock((s) => s.expiresAt);
  const durationMs = useSessionClock((s) => s.durationMs);
  const [now, setNow] = useState(() => Date.now());
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lastActive = useRef(Date.now());
  const flushedForToken = useRef<number | null>(null);
  const signedIn = Boolean(isAuthenticated && token && user);

  // Start the clock from a token that was saved before a reload. If that token has already run out,
  // the server decides whether the session is still within its idle window.
  useEffect(() => {
    if (!token || useSessionClock.getState().expiresAt) return;
    const times = tokenTimes(token);
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
    const onActivity = () => {
      lastActive.current = Date.now();
      const { issuedAt: issued, phase: current, durationMs: span } = useSessionClock.getState();
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
    const left = expiresAt - now;
    if (left <= 0) {
      useSessionClock.getState().markExpired('idle');
      return;
    }
    if (left <= warnMs(durationMs)) {
      if (phase !== 'warning') useSessionClock.getState().setPhase('warning');
      if (flushedForToken.current !== expiresAt) {
        flushedForToken.current = expiresAt;
        void flushPendingDraft();
      }
    } else if (phase === 'warning') {
      useSessionClock.getState().setPhase('active');
    }
  }, [now, expiresAt, phase, signedIn, user?.userId, durationMs]);

  // The session is over: if the open draft has changes the server never got, keep a copy on this device.
  useEffect(() => {
    if (phase !== 'expired' || !signedIn) return;
    void flushPendingDraft().then((result) => {
      if (result.dirty && !result.ok) backUpOpenDraft(user?.userId);
    });
  }, [phase, signedIn, user?.userId]);

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

  const signInAgain = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.login(user.email, password);
      const data = response?.data;
      if (!data?.token) throw new Error('Sign-in failed');
      if (String(data.userId) !== String(user.userId)) {
        // Someone else signed in: they must not see the previous person's screen.
        logout();
        navigate('/dashboard');
        return;
      }
      login(data, data.token);
      setPassword('');
      const saved = await flushPendingDraft();
      if (saved.ok) clearBackup();
      toast.success(tf(saved.ok ? 'Signed in again. Your work is saved.' : 'Signed in again.'));
    } catch (err: any) {
      setError(err?.response?.data?.message || tf('That password did not work.'));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    backUpOpenDraft(user?.userId);
    await api.logout();
    logout();
    navigate('/login');
  };

  if (!signedIn) return null;
  const left = expiresAt ? expiresAt - now : 0;

  if (phase === 'expired' && reason === 'deactivated') {
    return (
      <div className="motion-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="session-title">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-red-600" aria-hidden />
            <h2 id="session-title" className="text-lg font-semibold">{tf('Your account has been deactivated')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{tf('You have been signed out. Please contact the APMSMEDC Admin if you think this is a mistake.')}</p>
          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {tf('Sign out')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="motion-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="session-title">
        <form onSubmit={signInAgain} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-600" aria-hidden />
            <h2 id="session-title" className="text-lg font-semibold">
              {reason === 'idle' ? tf('Signed out after 15 minutes of inactivity') : tf('Your session has expired')}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {tf('Sign in again to carry on. What you were working on is still on this screen and will be saved.')}
          </p>
          <p className="text-sm font-medium">{user?.email}</p>
          <Input
            type="password"
            label={tf('Password')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {tf('Sign out')}
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !password}>
              {tf('Sign in again')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (phase === 'warning') {
    return (
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
    );
  }

  return null;
};
