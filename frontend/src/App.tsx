import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AppShell } from './features/shared/components/AppShell';
import { ProtectedRoute } from './features/shared/components/ProtectedRoute';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import { LoadingSpinner } from './features/shared/components/LoadingSpinner';
import { PlanProvider } from './contexts/PlanContext';

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
const PlanPage = lazy(() =>
  import('./features/plan/pages/PlanPage').then((m) => ({ default: m.PlanPage })),
);
const BuildPage = lazy(() =>
  import('./features/build/pages/BuildPage').then((m) => ({ default: m.BuildPage })),
);
const PlaceholderPage = lazy(() =>
  import('./features/shared/pages/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
);

/**
 * アプリケーションルーティング
 * Unit 2: / → PlanPage、/build → BuildPage に差し替え
 * PlanProvider を AppShell の親に配置（Plan → Build 遷移時に入力データを維持するため）
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
            <Route element={<PlanProvider><AppShell /></PlanProvider>}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<PlanPage />} />
              <Route path="/build" element={<BuildPage />} />
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
