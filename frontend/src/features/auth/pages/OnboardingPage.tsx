import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';

/**
 * オンボーディングページ（初期プロファイル設定）
 * US-30: オンボーディングでの経験レベル選択
 * BR-03: 初期プロファイル設定
 * BR-07: sakeExperience → disclosureLevel 初期設定
 */
export function OnboardingPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [locale, setLocale] = useState<'ja' | 'en'>('ja');
  const [sakeExperience, setSakeExperience] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = { nickname, locale };
      if (sakeExperience && sakeExperience !== 'skip') {
        body.sakeExperience = sakeExperience;
      }

      await apiClient.post('signup', { json: body });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="onboarding-page" style={{ maxWidth: '400px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 data-testid="onboarding-page-title" style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
        {t('onboarding.title')}
      </h1>

      <form onSubmit={handleSubmit} data-testid="onboarding-form">
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="onboarding-nickname">{t('onboarding.nickname')}</label>
          <input
            id="onboarding-nickname"
            data-testid="onboarding-form-nickname-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            minLength={2}
            maxLength={20}
            placeholder={t('onboarding.nicknamePlaceholder')}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="onboarding-locale">{t('onboarding.language')}</label>
          <select
            id="onboarding-locale"
            data-testid="onboarding-form-locale-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'ja' | 'en')}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label>{t('onboarding.experience')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {[
              { value: 'beginner', label: t('onboarding.experienceBeginner') },
              { value: 'intermediate', label: t('onboarding.experienceIntermediate') },
              { value: 'advanced', label: t('onboarding.experienceAdvanced') },
              { value: 'skip', label: t('onboarding.experienceSkip') },
            ].map((option) => (
              <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="sakeExperience"
                  data-testid={`onboarding-form-experience-${option.value}`}
                  value={option.value}
                  checked={sakeExperience === option.value}
                  onChange={(e) => setSakeExperience(e.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div data-testid="onboarding-form-error" role="alert" style={{ color: '#dc3545', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="onboarding-form-submit-button"
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px', backgroundColor: '#1a1a2e', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
          }}
        >
          {isLoading ? '...' : t('onboarding.submit')}
        </button>
      </form>
    </div>
  );
}
