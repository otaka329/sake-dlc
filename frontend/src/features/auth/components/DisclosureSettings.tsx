import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@/contexts/DisclosureContext';
import { apiClient } from '@/lib/api-client';

/**
 * 開示レイヤー設定（Settings 内、手動全解放）
 * US-29: 開示レイヤーに応じた表示切替
 * BR-07-08: Settings から手動で即全解放
 */
export function DisclosureSettings() {
  const { t } = useTranslation('auth');
  const { disclosureLevel, unlockAll } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlockAll = async () => {
    setIsLoading(true);
    try {
      await apiClient.put('disclosure-level', {
        json: { action: 'unlock_all' },
      });
      unlockAll();
    } catch (err) {
      console.error('開示レイヤー全解放に失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (disclosureLevel >= 3) {
    return (
      <div data-testid="disclosure-settings" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        <p style={{ color: '#28a745' }}>✅ すべての情報が表示されています</p>
      </div>
    );
  }

  return (
    <div data-testid="disclosure-settings" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <p style={{ marginBottom: '12px', color: '#666' }}>
        アプリを使い続けると、より詳しい情報が自動的に解放されます。
        すぐにすべての情報を見たい場合は、下のボタンを押してください。
      </p>
      <button
        data-testid="settings-disclosure-unlock-all-button"
        onClick={handleUnlockAll}
        disabled={isLoading}
        style={{
          padding: '8px 16px', backgroundColor: '#1a1a2e', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
        }}
      >
        {isLoading ? '...' : t('settings.disclosureUnlockAll')}
      </button>
    </div>
  );
}
