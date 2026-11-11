import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';
import { useCallback } from 'react';
import { teluguDictionary } from '@/lib/i18n/teLoader';

/** The same lookup as tf() for code outside React components (toasts raised from the API layer). */
export function translateNow(en: string): string {
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
  return lang.startsWith('te') ? teluguDictionary()[en] || en : en;
}

export function useClusterFormText() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
  const isTe = lang.startsWith('te');
  return useCallback(
    (en: string) => {
      if (!en) return en;
      if (!isTe) return en;
      const te = teluguDictionary()[en];
      if (!te && import.meta.env.DEV && /[A-Za-z]{3,}/.test(en)) {
        // Dev aid: `window.__tfMissing` lists English strings shown without a Telugu entry.
        const w = window as unknown as { __tfMissing?: Set<string> };
        (w.__tfMissing ||= new Set()).add(en);
      }
      return te || en;
    },
    [isTe]
  );
}
