import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

/**
 * MFA チャレンジページ（TOTP コード入力）
 * US-02B: MFA（多要素認証）設定
 * BR-02B-08: パスワード認証成功後に TOTP コード入力を要求
 */
export function MfaChallengePage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [totpCode, setTotpCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Cognito confirmSignIn（SOFTWARE_TOKEN_MFA チャレンジ応答）
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="mfa-challenge-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 data-testid="mfa-challenge-page-title" style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
        {t('mfa.title')}
      </h1>

      <form onSubmit={handleSubmit} data-testid="mfa-challenge-form">
        {!useRecovery ? (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="mfa-totp-code">{t('mfa.enterCode')}</label>
            <input
              id="mfa-totp-code"
              data-testid="mfa-challenge-form-totp-input"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              required
              autoComplete="one-time-code"
              style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="mfa-recovery-code">リカバリーコード</label>
            <input
              id="mfa-recovery-code"
              data-testid="mfa-challenge-form-recovery-input"
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        )}

        {error && (
          <div data-testid="mfa-challenge-form-error" role="alert" style={{ color: '#dc3545', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="mfa-challenge-form-submit-button"
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1a1a2e', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
          }}
        >
          {isLoading ? '...' : t('mfa.submit')}
        </button>

        <button
          type="button"
          data-testid="mfa-challenge-form-toggle-recovery"
          onClick={() => setUseRecovery(!useRecovery)}
          style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#1a1a2e', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {useRecovery ? t('mfa.enterCode') : t('mfa.useRecoveryCode')}
        </button>
      </form>
    </div>
  );
}
