import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * オフライン状態バナー
 * US-26: オフライン対応
 */
export function OfflineBanner() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="offline-banner"
      role="alert"
      style={{
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
      }}
    >
      {t('status.offline')}
    </div>
  );
}
