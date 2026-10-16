import { useEffect, useRef } from 'react';

/**
 * Calls `save` every `intervalMs` while `enabled`, but only when `shouldSave()` says there is something new.
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

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(async () => {
      if (busy.current || !shouldRef.current()) return;
      busy.current = true;
      try {
        await saveRef.current();
      } finally {
        busy.current = false;
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);
}
