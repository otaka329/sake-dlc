import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AppShell } from './features/shared/components/AppShell';
import { ProtectedRoute } from './features/shared/components/ProtectedRoute';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import { LoadingSpinner } from './features/shared/components/LoadingSpinner';

// 認証ページ（初期ロード）
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage';

// 遅延ロード（Feature 単位）
const OnboardingPage = lazy(() =>
  import('./features/auth/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const MfaChallengePage = lazy(() =>
  import('./features/auth/pages/MfaChallengePage').then((m) => ({ default: m.MfaChallengePage })),
);
const SettingsPage = lazy(() =>
  import('./features/auth/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const PlaceholderPage = lazy(() =>
  import('./features/shared/pages/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
);

/**
 * アプリケーションルーティング
 * 非認証ルートは PlaceholderPage にマッピング（Unit 2〜4 で各 Feature ページに差し替え）
 */
export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 公開ルート */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mfa-challenge" element={<MfaChallengePage />} />

          {/* 認証必須ルート */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<PlaceholderPage />} />
              <Route path="/build" element={<PlaceholderPage />} />
              <Route path="/test" element={<PlaceholderPage />} />
              <Route path="/deploy" element={<PlaceholderPage />} />
              <Route path="/monitor" element={<PlaceholderPage />} />
              <Route path="/optimize" element={<PlaceholderPage />} />
              <Route path="/discovery" element={<PlaceholderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* フォールバック */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
