import { useCallback, useEffect, useRef, useState } from 'react';
import { useIndividualDPRStore } from '@/store/individualDPRStore';

/** The parts of the draft that undo and redo move: every step's answers, the report look and extras, and the scheme-finder answers. */
const pick = (data: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const key of Object.keys(data || {})) {
    if (/^step\d+$/.test(key) || key === 'schemeExtras' || key === 'ventureMatchAnswers') out[key] = data[key];
  }
  return out;
};
const freeze = (data: Record<string, any>) => JSON.stringify(pick(data));

/**
 * Undo and redo for what the person has typed or styled. A step in the history is a settled change (typing is grouped: the history takes
 * a snapshot once the answers have stayed still for a moment), so one undo takes back one burst of typing, not one letter.
 */
export function useDataHistory({
  enabled,
  settleMs = 700,
  limit = 60,
  onRestore,
}: {
  enabled: boolean;
  settleMs?: number;
  limit?: number;
  onRestore?: (restored: Record<string, any>) => void;
}) {
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const last = useRef<string>('');
  const restoring = useRef(false);
  const timer = useRef(0);
  const [, setTick] = useState(0);
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;

  useEffect(() => {
    if (!enabled) return undefined;
    past.current = [];
    future.current = [];
    last.current = freeze(useIndividualDPRStore.getState().data);
    setTick((n) => n + 1);
    const settle = () => {
      const now = freeze(useIndividualDPRStore.getState().data);
      if (now === last.current) return;
      past.current.push(last.current);
      if (past.current.length > limit) past.current.shift();
      future.current = [];
      last.current = now;
      setTick((n) => n + 1);
    };
    const unsubscribe = useIndividualDPRStore.subscribe(() => {
      if (restoring.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(settle, settleMs);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer.current);
    };
  }, [enabled, settleMs, limit]);

  const apply = useCallback((snapshot: string) => {
    const restored = JSON.parse(snapshot);
    restoring.current = true;
    // Put back exactly what was there (set directly, so nothing is copied across steps on the way).
    useIndividualDPRStore.setState((state: any) => {
      const next = { ...state.data };
      for (const key of Object.keys(next)) {
        if (/^step\d+$/.test(key) && !(key in restored)) delete next[key];
      }
      return { data: { ...next, ...restored } };
    });
    last.current = snapshot;
    restoreRef.current?.(restored);
    window.setTimeout(() => {
      restoring.current = false;
    }, 0);
    setTick((n) => n + 1);
  }, []);

  const flush = () => {
    // Anything typed in the last moment becomes its own step first, so it can be undone too.
    window.clearTimeout(timer.current);
    const now = freeze(useIndividualDPRStore.getState().data);
    if (now !== last.current) {
      past.current.push(last.current);
      future.current = [];
      last.current = now;
    }
  };

  const undo = useCallback(() => {
    flush();
    const previous = past.current.pop();
    if (previous === undefined) {
      setTick((n) => n + 1);
      return;
    }
    future.current.push(last.current);
    apply(previous);
  }, [apply]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(last.current);
    apply(next);
  }, [apply]);

  return { undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
