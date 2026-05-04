import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ローディング表示
 */
interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export function LoadingSpinner({ size = 40, message }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="loading-spinner"
      role="status"
      aria-label={message || t('actions.loading')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #1a1a2e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && <p style={{ marginTop: '12px', color: '#666' }}>{message}</p>}
    </div>
  );
}
