import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useDisclosure } from '@/contexts/DisclosureContext';
import { LanguageSwitcher } from '@/features/shared/components/LanguageSwitcher';
import { MfaSetupSection } from '../components/MfaSetupSection';
import { DisclosureSettings } from '../components/DisclosureSettings';

/**
 * 設定ページ
 * プロファイル編集 + MFA 設定 + 開示レイヤー設定 + ログアウト
 */
export function SettingsPage() {
  const { t } = useTranslation('auth');
  const { user, logout } = useAuth();
  const { disclosureLevel } = useDisclosure();

  const levelLabels: Record<number, string> = {
    1: t('settings.disclosureLevel1'),
    2: t('settings.disclosureLevel2'),
    3: t('settings.disclosureLevel3'),
  };

  return (
    <div data-testid="settings-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 data-testid="settings-page-title" style={{ fontSize: '24px', marginBottom: '24px' }}>
        {t('settings.title')}
      </h1>

      {/* プロファイルセクション */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('settings.profile')}</h2>
        <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <p><strong>ニックネーム:</strong> {user?.nickname}</p>
          <p><strong>メール:</strong> {user?.email}</p>
          <div style={{ marginTop: '12px' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {/* セキュリティセクション */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('settings.security')}</h2>
        <MfaSetupSection />
      </section>

      {/* 開示レイヤーセクション */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('settings.disclosure')}</h2>
        <p style={{ marginBottom: '8px' }}>
          {t('settings.disclosureCurrentLevel')}: <strong>{levelLabels[disclosureLevel]}</strong>
        </p>
        <DisclosureSettings />
      </section>

      {/* ログアウト */}
      <button
        data-testid="settings-logout-button"
        onClick={logout}
        style={{
          width: '100%', padding: '12px', backgroundColor: '#dc3545', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
        }}
      >
        {t('settings.logout')}
      </button>
    </div>
  );
}
