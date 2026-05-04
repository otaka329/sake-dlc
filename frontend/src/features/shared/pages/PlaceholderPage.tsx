import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 非認証ルート用スタブページ
 * Unit 2〜4 で各 Feature ページに差し替え
 */
export function PlaceholderPage() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="placeholder-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#1a1a2e' }}>
        {t('placeholder.title')}
      </h2>
      <p style={{ color: '#666' }}>{t('placeholder.message')}</p>
    </div>
  );
}
