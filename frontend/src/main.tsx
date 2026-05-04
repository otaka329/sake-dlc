import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { DisclosureProvider } from './contexts/DisclosureContext';
import './i18n/config';
import './lib/register-sw';

/**
 * アプリケーションエントリポイント
 * Context プロバイダーの階層: Auth → App → Disclosure
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <DisclosureProvider>
            <App />
          </DisclosureProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
