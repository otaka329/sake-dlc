import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 初期ロード namespace（common, auth, errors）
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaErrors from './locales/ja/errors.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';

/**
 * react-i18next 初期化
 * US-03: 言語設定（ja/en）
 * NFR Design §2.3: namespace 分割、遅延ロード
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { common: jaCommon, auth: jaAuth, errors: jaErrors },
      en: { common: enCommon, auth: enAuth, errors: enErrors },
    },
    fallbackLng: 'ja',
    defaultNS: 'common',
    ns: ['common', 'auth', 'errors'],
    interpolation: {
      escapeValue: false, // React が XSS 対策済み
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sdlc-locale',
    },
  });

export default i18n;
