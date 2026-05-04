# Unit 1: Foundation — フロントエンドコードサマリー

## 生成ファイル一覧

### 基盤（frontend/src/）
| ファイル | 責務 |
|---|---|
| main.tsx | React エントリポイント、Context プロバイダー階層 |
| App.tsx | React Router 設定、ProtectedRoute、遅延ロード |
| vite-env.d.ts | 環境変数型定義 |

### Context（frontend/src/contexts/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| AuthContext.tsx | 認証状態管理、トークン管理 | US-01, US-02 |
| AppContext.tsx | ロケール、オフライン状態 | US-03, US-26 |
| DisclosureContext.tsx | 開示レイヤー管理 | US-29 |

### API クライアント（frontend/src/lib/）
| ファイル | 責務 |
|---|---|
| api-client.ts | ky インスタンス（リトライ、トークン付与、リフレッシュ） |
| token-storage.ts | localStorage ラッパー |
| register-sw.ts | Service Worker 登録 |

### i18n（frontend/src/i18n/）
| ファイル | 責務 |
|---|---|
| config.ts | react-i18next 初期化 |
| locales/ja/*.json | 日本語翻訳（common, auth, errors） |
| locales/en/*.json | 英語翻訳（common, auth, errors） |

### 共通コンポーネント（frontend/src/features/shared/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| AppShell.tsx | レイアウト（ヘッダー + コンテンツ + タブバー） | — |
| TabBar.tsx | 下部タブナビゲーション | — |
| ProtectedRoute.tsx | 認証ガード | — |
| OfflineBanner.tsx | オフライン状態バナー | US-26 |
| LanguageSwitcher.tsx | 言語切替トグル | US-03 |
| LoadingSpinner.tsx | ローディング表示 | — |
| ErrorBoundary.tsx | グローバルエラーバウンダリ | — |
| PlaceholderPage.tsx | 非認証ルート用スタブ | — |

### 認証コンポーネント（frontend/src/features/auth/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| LoginPage.tsx | ログインフォーム + ソーシャルログイン | US-01, US-02 |
| SignupPage.tsx | サインアップフォーム + ブロックリスト照合 | US-01 |
| OnboardingPage.tsx | 初期プロファイル設定 | US-30 |
| MfaChallengePage.tsx | MFA TOTP コード入力 | US-02B |
| SettingsPage.tsx | 設定画面（プロファイル + MFA + 開示レイヤー） | US-02B, US-29 |
| MfaSetupSection.tsx | MFA セットアップ（Settings 内） | US-02B |
| DisclosureSettings.tsx | 開示レイヤー設定（Settings 内） | US-29 |

### PWA（frontend/public/）
| ファイル | 責務 |
|---|---|
| manifest.json | Web App Manifest | US-25 |

### テスト
- ユニットテスト: 7ファイル
- PBT: 5ファイル
