import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

/**
 * MFA セットアップセクション（Settings 内）
 * US-02B: MFA（多要素認証）設定
 */
export function MfaSetupSection() {
  const { t } = useTranslation('auth');
  const { user } = useAuth();
  const [isSetupMode, setIsSetupMode] = useState(false);

  if (!user) return null;

  return (
    <div data-testid="mfa-setup-section" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      {user.mfaEnabled ? (
        <div>
          <p style={{ color: '#28a745', marginBottom: '12px' }}>✅ 二段階認証が有効です</p>
          <button
            data-testid="settings-mfa-disable-button"
            onClick={() => { /* TODO: MFA 無効化フロー */ }}
            style={{
              padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
            }}
          >
            {t('mfa.disable')}
          </button>
        </div>
      ) : (
        <div>
          {!isSetupMode ? (
            <button
              data-testid="settings-mfa-enable-button"
              onClick={() => setIsSetupMode(true)}
              style={{
                padding: '8px 16px', backgroundColor: '#1a1a2e', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}
            >
              {t('mfa.setup')}
            </button>
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}>{t('mfa.scanQr')}</p>
              {/* TODO: QR コード表示、TOTP 検証フロー */}
              <p data-testid="mfa-setup-placeholder" style={{ color: '#666' }}>
                セットアップフローは Cognito SDK 統合時に実装
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
