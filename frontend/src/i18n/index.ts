import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/common.json';
import pl from '../locales/pl/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'pl'] as const;
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: en }, pl: { common: pl } },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'splitapp:lang',
    },
  });

export default i18n;
