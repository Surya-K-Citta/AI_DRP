import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { formatClock, idleLeftMs, useSessionClock, warnMs } from '@/lib/sessionClock';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/** Time left before the idle logout, shown in the header. It counts down only while idle and starts over with every input. */
export const SessionTimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const tf = useClusterFormText();
  const expiresAt = useSessionClock((s) => s.expiresAt);
  const phase = useSessionClock((s) => s.phase);
  const durationMs = useSessionClock((s) => s.durationMs);
  const lastActivityAt = useSessionClock((s) => s.lastActivityAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!expiresAt) return null;
  // The time left before the idle logout: it starts over at once with every click or key press and only runs down while idle.
  const left = phase === 'expired' ? 0 : Math.max(0, idleLeftMs(lastActivityAt, durationMs, now));
  const tone =
    left <= warnMs(durationMs)
      ? 'border-red-300 bg-red-50 text-red-700'
      : left <= durationMs / 5
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-border bg-muted/50 text-muted-foreground';

  return (
    <span
      role="timer"
      title={tf('Time left in this session. You are signed out after 6 minutes without activity. Working in the app keeps it going.')}
      aria-label={`${tf('Session time left')}: ${formatClock(left)}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums ${tone} ${className}`}
    >
      <Timer className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{tf('Session')}</span>
      <span>{formatClock(left)}</span>
    </span>
  );
};
