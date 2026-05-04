import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/**
 * ログインページ
 * US-01: メール＋パスワードログイン
 * US-02: ソーシャルログイン（Google/Apple）
 */
export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Cognito signIn API 呼び出し
      // MFA 有効ユーザーの場合は /mfa-challenge に遷移
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="login-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 data-testid="login-page-title" style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
        {t('login.title')}
      </h1>

      <form onSubmit={handleSubmit} data-testid="login-form">
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: '4px' }}>
            {t('login.email')}
          </label>
          <input
            id="login-email"
            data-testid="login-form-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '4px' }}>
            {t('login.password')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              data-testid="login-form-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              type="button"
              data-testid="login-form-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && (
          <div data-testid="login-form-error" role="alert" style={{ color: '#dc3545', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="login-form-submit-button"
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1a1a2e', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
          }}
        >
          {isLoading ? '...' : t('login.submit')}
        </button>
      </form>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          data-testid="login-form-google-button"
          onClick={() => { /* TODO: Cognito OAuth Google */ }}
          style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fff' }}
        >
          {t('login.socialGoogle')}
        </button>
        <button
          data-testid="login-form-apple-button"
          onClick={() => { /* TODO: Cognito OAuth Apple */ }}
          style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fff' }}
        >
          {t('login.socialApple')}
        </button>
      </div>

      <p style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/signup" data-testid="login-form-signup-link">{t('login.signupLink')}</Link>
      </p>
    </div>
  );
}
