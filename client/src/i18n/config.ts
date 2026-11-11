// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import { loadTelugu } from '@/lib/i18n/teLoader';

const savedLanguage = typeof localStorage !== 'undefined' && localStorage.getItem('i18nextLng') === 'te'
  ? 'te'
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Telugu text is fetched the first time it is needed; the language only switches once it has arrived.
const switchLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (async (lng?: string, ...rest: any[]) => {
  if (lng && lng.toLowerCase().startsWith('te')) {
    try { await loadTelugu(i18n); } catch { return switchLanguage('en', ...rest); }
  }
  return switchLanguage(lng, ...rest);
}) as typeof i18n.changeLanguage;

/** Resolves when the saved language has its text. main.tsx waits for it before the first paint. */
export const i18nReady: Promise<void> =
  savedLanguage === 'te' ? loadTelugu(i18n).then(() => { void switchLanguage('te'); }).catch(() => { void switchLanguage('en'); }) : Promise.resolve();

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.startsWith('te') ? 'te' : 'en';
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage === 'te' ? 'te' : 'en';
}

export default i18n;

