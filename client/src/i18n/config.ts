// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import teTranslations from './locales/te.json';

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
      te: {
        translation: teTranslations,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;

