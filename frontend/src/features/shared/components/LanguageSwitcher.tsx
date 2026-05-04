import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';

/**
 * 言語切替トグル（ja/en）
 * US-03: 言語設定
 */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useApp();

  return (
    <div data-testid="language-switcher" role="group" aria-label="言語切替">
      <button
        data-testid="language-switcher-ja"
        onClick={() => setLocale('ja')}
        aria-pressed={locale === 'ja'}
        style={{
          fontWeight: locale === 'ja' ? 'bold' : 'normal',
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px 0 0 4px',
          cursor: 'pointer',
          backgroundColor: locale === 'ja' ? '#1a1a2e' : '#fff',
          color: locale === 'ja' ? '#fff' : '#333',
        }}
      >
        {t('language.ja')}
      </button>
      <button
        data-testid="language-switcher-en"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        style={{
          fontWeight: locale === 'en' ? 'bold' : 'normal',
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          backgroundColor: locale === 'en' ? '#1a1a2e' : '#fff',
          color: locale === 'en' ? '#fff' : '#333',
        }}
      >
        {t('language.en')}
      </button>
    </div>
  );
}
