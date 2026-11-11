import { useEffect, useRef } from 'react';

/**
 * Saves the draft once `intervalMs` has passed since something first changed (`shouldSave()` turns true), then starts again with the
 * next change. `dueAt` is when the coming save is due (null when nothing is waiting), so a button can show the countdown.
 * Never overlaps itself: a tick is skipped while the previous save is still running.
 */
export function useDraftAutosave({
  enabled,
  intervalMs = 30_000,
  shouldSave,
  save,
}: {
  enabled: boolean;
  intervalMs?: number;
  shouldSave: () => boolean;
  save: () => Promise<unknown>;
}) {
  const shouldRef = useRef(shouldSave);
  const saveRef = useRef(save);
  shouldRef.current = shouldSave;
  saveRef.current = save;
  const busy = useRef(false);
  const dueAt = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      dueAt.current = null;
      return undefined;
    }
    const timer = window.setInterval(async () => {
      if (!shouldRef.current()) {
        dueAt.current = null;
        return;
      }
      const now = Date.now();
      if (dueAt.current === null) dueAt.current = now + intervalMs;
      if (busy.current || now < dueAt.current) return;
      busy.current = true;
      try {
        await saveRef.current();
      } finally {
        busy.current = false;
        dueAt.current = null;
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);

  return { dueAt, intervalMs };
}
