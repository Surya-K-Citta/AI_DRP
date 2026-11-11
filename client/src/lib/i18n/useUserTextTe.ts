import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { applyUserTranslations, collectUserTexts } from '@/lib/i18n/userTextTe';

export type UserTextStatus = 'idle' | 'translating' | 'done' | 'unavailable';

// Kept for the session so switching steps or languages never asks again for text already translated.
const cache = new Map<string, string>();
const BATCH = 40;

/**
 * Returns the answers with the person's own typed text translated to Telugu when `enabled`.
 * Needs AI help to be on (the translation is done by the AI service); without it the text stays as typed and
 * `status` is `unavailable`, so the screen can say why.
 */
export function useUserTextTe<T>(data: T, enabled: boolean, aiAllowed: boolean, isKnown: (text: string) => boolean) {
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<UserTextStatus>('idle');
  const knownRef = useRef(isKnown);
  knownRef.current = isKnown;

  const pending = useMemo(
    () => (enabled ? collectUserTexts(data).filter((text) => !cache.has(text) && !knownRef.current(text)) : []),
    [data, enabled, version]
  );

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }
    if (!pending.length) {
      setStatus('done');
      return undefined;
    }
    if (!aiAllowed) {
      setStatus('unavailable');
      return undefined;
    }
    let cancelled = false;
    setStatus('translating');
    const timer = window.setTimeout(async () => {
      try {
        for (let i = 0; i < pending.length; i += BATCH) {
          const batch = pending.slice(i, i + BATCH);
          const res = await api.translateUserTexts(batch);
          const out: string[] = res?.data?.translations || [];
          batch.forEach((text, n) => cache.set(text, out[n] && out[n].trim() ? out[n] : text));
        }
        if (!cancelled) setVersion((v) => v + 1);
      } catch {
        // Left as typed. The next change to the answers tries again.
        pending.forEach((text) => { if (!cache.has(text)) cache.set(text, text); });
        if (!cancelled) {
          setStatus('unavailable');
          setVersion((v) => v + 1);
        }
      }
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pending, enabled, aiAllowed]);

  const translated = useMemo(
    () => (enabled ? applyUserTranslations(data, cache) : data),
    [data, enabled, version]
  );
  return { data: translated, status };
}
