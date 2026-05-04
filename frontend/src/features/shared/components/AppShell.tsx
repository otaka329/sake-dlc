import React from 'react';
import { Outlet } from 'react-router';
import { TabBar } from './TabBar';
import { OfflineBanner } from './OfflineBanner';
import { useApp } from '@/contexts/AppContext';

/**
 * アプリ全体のレイアウト（ヘッダー + コンテンツ + タブバー）
 */
export function AppShell() {
  const { isOffline } = useApp();

  return (
    <div data-testid="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {isOffline && <OfflineBanner />}
      <main style={{ flex: 1, padding: '16px' }}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
