import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

/**
 * 下部タブナビゲーション
 * Plan | Build | Test | Deploy | Monitor | More(⚙)
 */

const tabs = [
  { path: '/', labelKey: 'nav.plan' },
  { path: '/build', labelKey: 'nav.build' },
  { path: '/test', labelKey: 'nav.test' },
  { path: '/deploy', labelKey: 'nav.deploy' },
  { path: '/monitor', labelKey: 'nav.monitor' },
  { path: '/settings', labelKey: 'nav.more' },
] as const;

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav data-testid="tab-bar" role="navigation" aria-label="メインナビゲーション" style={{
      display: 'flex',
      justifyContent: 'space-around',
      borderTop: '1px solid #e0e0e0',
      padding: '8px 0',
      backgroundColor: '#fff',
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            data-testid={`tab-bar-${tab.labelKey.split('.')[1]}`}
            onClick={() => navigate(tab.path)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? '#1a1a2e' : '#666',
            }}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
