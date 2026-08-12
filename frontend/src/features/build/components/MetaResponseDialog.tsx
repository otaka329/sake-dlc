import { useTranslation } from 'react-i18next';
import type { MetaResponse } from '@sdlc/shared-types';

/**
 * メタ応答ダイアログ（US-16）
 * 判断委任的質問への思慮深い応答表示
 */
interface MetaResponseDialogProps {
  response: MetaResponse;
  onDismiss: () => void;
}

export function MetaResponseDialog({ response, onDismiss }: MetaResponseDialogProps) {
  const { t } = useTranslation('build');

  return (
    <div
      data-testid="build-meta-response-dialog"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 100,
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p data-testid="build-meta-response-message" style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '16px' }}>
          {response.message}
        </p>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          💡 {t(`meta.action.${response.suggestedAction}`)}
        </p>
        <button
          data-testid="build-meta-response-dismiss"
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {t('meta.dismiss')}
        </button>
      </div>
    </div>
  );
}
