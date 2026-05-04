import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/**
 * サインアップページ
 * US-01: ユーザー登録（メール＋パスワード）
 * BL-08: ブロックリスト照合（フロントエンド実施）
 */

// カスタム辞書（BR-01-07）
const CUSTOM_DICTIONARY = [
  'sdlc', 'sake', 'sakenowa', 'nihonshu', 'password', 'qwerty',
  'letmein', 'welcome', 'admin', 'login',
];

/**
 * HaveIBeenPwned k-anonymity チェック（フロントエンド実施）
 * パスワードの SHA-1 先頭5文字のみ送信（k-anonymity）
 */
async function checkHaveIBeenPwned(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return false; // Fail-open
    const text = await response.text();
    return text.split('\n').some((line) => line.split(':')[0].trim() === suffix);
  } catch {
    return false; // Fail-open（タイムアウト/ネットワークエラー）
  }
}

function checkCustomDictionary(password: string): string | null {
  const lower = password.toLowerCase();
  for (const word of CUSTOM_DICTIONARY) {
    if (lower.includes(word)) return word;
  }
  return null;
}

function checkContextSpecific(password: string, email: string): boolean {
  const lower = password.toLowerCase();
  const [localPart, domain] = email.toLowerCase().split('@');
  if (localPart && localPart.length >= 3 && lower.includes(localPart)) return true;
  if (domain) {
    const domainName = domain.split('.')[0];
    if (domainName && domainName.length >= 3 && lower.includes(domainName)) return true;
  }
  return false;
}

export function SignupPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 15) {
      setError(t('signup.passwordHint'));
      return;
    }

    setIsLoading(true);

    try {
      // ブロックリスト照合（BL-08）
      const dictWord = checkCustomDictionary(password);
      if (dictWord) {
        setError(`${t('signup.passwordBlocked')}`);
        return;
      }

      if (checkContextSpecific(password, email)) {
        setError(t('signup.passwordBlocked'));
        return;
      }

      const isPwned = await checkHaveIBeenPwned(password);
      if (isPwned) {
        setError(`${t('signup.passwordBlocked')} ${t('signup.passwordBlockedHint')}`);
        return;
      }

      // TODO: Cognito signUp API 呼び出し
      // 成功 → 確認メール送信画面
      navigate('/login');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="signup-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 data-testid="signup-page-title" style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
        {t('signup.title')}
      </h1>

      <form onSubmit={handleSubmit} data-testid="signup-form">
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="signup-email">{t('signup.email')}</label>
          <input
            id="signup-email"
            data-testid="signup-form-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="signup-password">{t('signup.password')}</label>
          <input
            id="signup-password"
            data-testid="signup-form-password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={15}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <small style={{ color: '#666' }}>{t('signup.passwordHint')}</small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="signup-confirm-password">{t('signup.confirmPassword')}</label>
          <input
            id="signup-confirm-password"
            data-testid="signup-form-confirm-password-input"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <input
            type="checkbox"
            data-testid="signup-form-show-password"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          {showPassword ? t('login.hidePassword') : t('login.showPassword')}
        </label>

        {error && (
          <div data-testid="signup-form-error" role="alert" style={{ color: '#dc3545', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="signup-form-submit-button"
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1a1a2e', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
          }}
        >
          {isLoading ? '...' : t('signup.submit')}
        </button>
      </form>

      <p style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/login" data-testid="signup-form-login-link">{t('signup.loginLink')}</Link>
      </p>
    </div>
  );
}
