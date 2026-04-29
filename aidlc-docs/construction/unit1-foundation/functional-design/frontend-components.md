# Unit 1: Foundation — フロントエンドコンポーネント設計

---

## ページ構成（React Router）

| パス | コンポーネント | 認証 | 説明 |
|---|---|---|---|
| `/login` | LoginPage | 不要 | ログイン画面 |
| `/signup` | SignupPage | 不要 | サインアップ画面 |
| `/onboarding` | OnboardingPage | 必要 | 初期プロファイル設定 |
| `/` | HomePage (Plan タブ) | 必要 | SDLCサイクル — Plan |
| `/build` | BuildPage | 必要 | SDLCサイクル — Build |
| `/test` | TestPage | 必要 | SDLCサイクル — Test |
| `/deploy` | DeployPage | 必要 | SDLCサイクル — Deploy |
| `/monitor` | MonitorPage | 必要 | SDLCサイクル — Monitor |
| `/optimize` | OptimizePage | 必要 | SDLCサイクル — Optimize |
| `/discovery` | DiscoveryPage | 必要 | Sake Discovery |
| `/settings` | SettingsPage | 必要 | 設定画面 |

---

## タブナビゲーション構成

下部タブバー（6タブ + Discovery + Settings）:

```
┌─────────────────────────────────────────────┐
|                  メインコンテンツ              |
|                                             |
├─────────────────────────────────────────────┤
| Plan | Build | Test | Deploy | Monitor | ⚙  |
└─────────────────────────────────────────────┘
```

- Plan〜Monitor: SDLCサイクルの6ステップ（Optimizeは Monitor内のサブタブ）
- ⚙: その他メニュー（Discovery, Settings, Optimize）

---

## 共通コンポーネント（FE-09: SharedComponents）

### AppShell
- **責務**: アプリ全体のレイアウト（ヘッダー + コンテンツ + タブバー）
- **Props**: children
- **状態**: currentTab（React Router の location から判定）

### TabBar
- **責務**: 下部タブナビゲーション
- **Props**: なし（React Router の useLocation で現在タブを判定）
- **タブ項目**: Plan, Build, Test, Deploy, Monitor, More(⚙)

### ProtectedRoute
- **責務**: 認証ガード（未認証時は /login にリダイレクト）
- **Props**: children
- **状態**: AuthContext の isAuthenticated を参照

### OfflineBanner
- **責務**: オフライン状態の表示
- **Props**: なし
- **状態**: navigator.onLine + online/offline イベントリスナー

### LanguageSwitcher
- **責務**: 言語切替トグル（ja/en）
- **Props**: なし
- **状態**: i18n.language

### LoadingSpinner
- **責務**: ローディング表示
- **Props**: size?, message?

### ErrorBoundary
- **責務**: エラーハンドリング（グローバルエラーキャッチ）
- **Props**: children, fallback?

---

## 認証コンポーネント（FE-01: AuthFeature）

### LoginPage
- **責務**: ログインフォーム + ソーシャルログインボタン
- **フォームフィールド**: email (string), password (string)
- **バリデーション**: email形式チェック, パスワード8文字以上（MFA有効時）or 15文字以上（MFA無効時）
- **アクション**: Cognito signIn / Google OAuth / Apple OAuth
- **MFAフロー**: パスワード認証成功後、MFA有効ユーザーにはTOTPコード入力画面を表示
- **遷移先**: 成功 → `/`（既存ユーザー）or `/onboarding`（新規）

### MfaChallengePage
- **責務**: MFAチャレンジ（TOTPコード入力）
- **フォームフィールド**: totpCode (string, 6桁数字)
- **バリデーション**: 6桁数字チェック
- **アクション**: Cognito confirmSignIn（SOFTWARE_TOKEN_MFA チャレンジ応答）
- **代替**: 「リカバリーコードを使用」リンク → リカバリーコード入力フォーム
- **遷移先**: 成功 → `/`

### SignupPage
- **責務**: サインアップフォーム
- **フォームフィールド**: email (string), password (string), confirmPassword (string)
- **バリデーション**: email形式, パスワード8文字以上, パスワード一致
- **アクション**: Cognito signUp → 確認メール送信
- **遷移先**: メール確認画面 → 確認後 `/onboarding`

### OnboardingPage
- **責務**: 初期プロファイル設定
- **フォームフィールド**: nickname (string), locale (select: ja/en), sakeExperience (select: beginner/intermediate/advanced)
- **バリデーション**: BR-03-01〜BR-03-04
- **アクション**: POST /signup API
- **遷移先**: 成功 → `/`

---

## React Context 定義

### AuthContext
```typescript
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: UserSession | null;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: UserSession } }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { tokens: UserSession } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean };
```

### AppContext
```typescript
interface AppState {
  locale: 'ja' | 'en';
  isOffline: boolean;
  currentCycleStep: 'plan' | 'build' | 'test' | 'deploy' | 'monitor' | 'optimize';
}

type AppAction =
  | { type: 'SET_LOCALE'; payload: 'ja' | 'en' }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_CYCLE_STEP'; payload: string };
```

---

## API統合ポイント

| コンポーネント | APIエンドポイント | メソッド | 説明 |
|---|---|---|---|
| SignupPage | Cognito signUp | SDK | ユーザー登録 |
| LoginPage | Cognito signIn | SDK | ログイン |
| LoginPage | Cognito OAuth | SDK | ソーシャルログイン |
| MfaChallengePage | Cognito confirmSignIn | SDK | MFAチャレンジ応答 |
| OnboardingPage | POST /signup | REST | プロファイル初期設定 |
| SettingsPage | PUT /profile | REST | プロファイル更新 |
| SettingsPage | GET /profile | REST | プロファイル取得 |
| MfaSetupSection | Cognito associateSoftwareToken | SDK | TOTPシークレット取得 |
| MfaSetupSection | Cognito verifySoftwareToken | SDK | TOTP検証・有効化 |
| MfaSetupSection | POST /mfa/recovery-codes | REST | リカバリーコード発行 |
