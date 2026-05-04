# Unit 1: Foundation — Code Generation 計画

---

## ユニットコンテキスト

### 実装対象ストーリー
| ストーリー | タイトル | 優先度 |
|---|---|---|
| US-01 | ユーザー登録（メール＋パスワード） | Must |
| US-02 | ソーシャルログイン（Google/Apple） | Must |
| US-02B | MFA（多要素認証）設定 | Should |
| US-03 | 言語設定 | Must |
| US-25 | ホーム画面への追加 | Must |
| US-26 | オフライン対応 | Should |
| US-29 | 開示レイヤーに応じた表示切替 | Must |
| US-30 | オンボーディングでの経験レベル選択 | Should |

### 依存関係
- CM-01 AIGateway: インターフェース定義＋スタブ（Unit 2 で本実装）
- CM-02 SakenowaClient: インターフェース定義＋スタブ（Unit 3 で本実装）
- DynamoDB 5テーブル: スキーマ定義（Terraform）

### 所有エンティティ
- User（Users テーブル、SK: PROFILE）
- TasteProfile（TasteProfiles テーブル、初期化のみ）
- AppData（レート制限カウンター）

---

## コード生成ステップ

### Phase A: プロジェクト構造セットアップ

- [x] Step 1: monorepo ルート設定
  - package.json（ワークスペース定義）
  - tsconfig.base.json（共通 TypeScript 設定）
  - .eslintrc.json, .prettierrc（リンター・フォーマッター）
  - .gitignore 更新

- [x] Step 2: packages/shared-types パッケージ
  - package.json, tsconfig.json
  - src/index.ts（エクスポート集約）
  - src/schemas/user.ts（User Zod スキーマ、signupRequestSchema, updateProfileSchema, updateDisclosureLevelSchema, userResponseSchema, errorResponseSchema）
  - src/schemas/mfa.ts（mfaRecoveryCodesSchema）
  - src/types/api.ts（APIリクエスト/レスポンス型）
  - src/types/disclosure.ts（DisclosureLevel, UnlockCategory 型）
  - src/ai-gateway.ts（CM-01 AIGateway インターフェース＋スタブ）
  - src/sakenowa-client.ts（CM-02 SakenowaClient インターフェース＋スタブ）

### Phase B: バックエンド
- [x] Step 3: backend パッケージ基盤
  - package.json, tsconfig.json, esbuild.config.ts
  - src/lib/logger.ts（Powertools Logger ラッパー、PII マスク設定）
  - src/lib/tracer.ts（Powertools Tracer ラッパー）
  - src/lib/metrics.ts（Powertools Metrics ラッパー）
  - src/lib/dynamodb.ts（DynamoDB DocumentClient シングルトン、テーブル名設定）
  - src/lib/errors.ts（AppError 階層: ValidationError, AuthError, ForbiddenError, NotFoundError, RateLimitError, InternalError）
  - src/lib/response.ts（構造化レスポンスヘルパー: success, error）

- [x] Step 4: ミドルウェア層
  - src/middleware/create-handler.ts（共通ハンドラーラッパー: Logger/Tracer/Metrics 初期化、Zod バリデーション、エラーハンドリング、AuthExtractor）
  - src/middleware/rate-limiter.ts（DynamoDB アトミック演算によるユーザーレベルレート制限）

- [x] Step 5: 認証ハンドラー（US-01, US-02, US-30）
  - src/handlers/auth/signup.ts（POST /signup: プロファイル初期化 + TasteProfile 作成 + disclosureLevel 算出）
  - src/handlers/auth/get-profile.ts（GET /profile）
  - src/handlers/auth/put-profile.ts（PUT /profile）

- [x] Step 6: MFA ハンドラー（US-02B）
  - src/handlers/auth/mfa-setup.ts（POST /mfa/setup: TOTP シークレット生成）
  - src/handlers/auth/mfa-verify.ts（POST /mfa/verify: TOTP 検証・有効化）
  - src/handlers/auth/delete-mfa.ts（DELETE /mfa: MFA 無効化）
  - src/handlers/auth/recovery-codes.ts（POST /mfa/recovery-codes: リカバリーコード発行、HMAC-SHA-256）

- [x] Step 7: 開示レイヤー・Pre Sign-up・バックアップハンドラー（US-29）
  - src/handlers/auth/put-disclosure-level.ts（PUT /disclosure-level: カテゴリ別解放 / 全解放）
  - src/handlers/auth/pre-signup.ts（Cognito Pre Sign-up Trigger: ブロックリスト照合 BL-08）
  - src/handlers/auth/daily-backup.ts（Cognito 日次バックアップ: ListUsers → S3 エクスポート）

- [x] Step 8: バックエンドユニットテスト
  - tests/lib/errors.test.ts
  - tests/lib/response.test.ts
  - tests/middleware/create-handler.test.ts
  - tests/middleware/rate-limiter.test.ts
  - tests/handlers/auth/signup.test.ts
  - tests/handlers/auth/get-profile.test.ts
  - tests/handlers/auth/put-profile.test.ts
  - tests/handlers/auth/put-disclosure-level.test.ts
  - tests/handlers/auth/pre-signup.test.ts
  - tests/handlers/auth/mfa-setup.test.ts
  - tests/handlers/auth/mfa-verify.test.ts
  - tests/handlers/auth/delete-mfa.test.ts
  - tests/handlers/auth/recovery-codes.test.ts

- [x] Step 9: バックエンド PBT（fast-check）
  - tests/pbt/password-validation.pbt.ts（BR-01: 15文字以上で合格、14文字以下で不合格）
  - tests/pbt/nickname-validation.pbt.ts（BR-03: 2-20文字、許可文字のみ）
  - tests/pbt/email-validation.pbt.ts（RFC 5322 準拠）
  - tests/pbt/disclosure-level.pbt.ts（単調増加 Invariant: disclosureLevel は 1→2→3 のみ）
  - tests/pbt/rate-limiter.pbt.ts（カウント値 0〜上限 Invariant）
  - tests/pbt/error-response.pbt.ts（全エラーが { code, message } 構造を持つ Invariant）
  - tests/pbt/pii-mask.pbt.ts（マスク後に平文 email/password が含まれない Invariant）
  - tests/pbt/generators/user.ts（User ドメインジェネレーター）
  - tests/pbt/generators/password.ts（パスワードジェネレーター: NIST 準拠/非準拠）

- [x] Step 10: バックエンドコードサマリー
  - aidlc-docs/construction/unit1-foundation/code/backend-summary.md

### Phase C: フロントエンド

- [x] Step 11: frontend パッケージ基盤
  - package.json, tsconfig.json, vite.config.ts（Vitest 設定 + vite-plugin-pwa 設定含む）
  - index.html
  - src/main.tsx（React エントリポイント）
  - src/App.tsx（React Router 設定、ProtectedRoute。非認証ルートは PlaceholderPage にマッピング）
  - src/vite-env.d.ts

- [x] Step 12: Context・Hooks・ユーティリティ（US-03, US-29）
  - src/contexts/AuthContext.tsx（AuthProvider, useAuth）
  - src/contexts/AppContext.tsx（AppProvider, useApp: locale, offline）
  - src/contexts/DisclosureContext.tsx（DisclosureProvider, useDisclosure: disclosureLevel, unlockedCategories, isLayerVisible, isCategoryUnlocked）
  - src/hooks/useTokenRefresh.ts（トークン自動リフレッシュ）
  - src/lib/api-client.ts（ky インスタンス: authHook, refreshHook, errorHook）
  - src/lib/token-storage.ts（localStorage ラッパー）
  - src/i18n/config.ts（react-i18next 初期化、namespace 分割）
  - src/i18n/locales/ja/common.json, auth.json, errors.json
  - src/i18n/locales/en/common.json, auth.json, errors.json

- [x] Step 13: 共通コンポーネント（US-25, US-26）
  - src/features/shared/components/AppShell.tsx
  - src/features/shared/components/TabBar.tsx
  - src/features/shared/components/ProtectedRoute.tsx
  - src/features/shared/components/OfflineBanner.tsx
  - src/features/shared/components/LanguageSwitcher.tsx
  - src/features/shared/components/LoadingSpinner.tsx
  - src/features/shared/components/ErrorBoundary.tsx
  - src/features/shared/pages/PlaceholderPage.tsx（非認証ルート用スタブ。「この機能は今後のアップデートで追加されます」を i18n 対応で表示。Unit 2〜4 で各 Feature ページに差し替え）

- [x] Step 14: 認証コンポーネント（US-01, US-02, US-02B, US-30）
  - src/features/auth/pages/LoginPage.tsx
  - src/features/auth/pages/SignupPage.tsx
  - src/features/auth/pages/OnboardingPage.tsx（sakeExperience 任意、disclosureLevel 初期設定）
  - src/features/auth/pages/MfaChallengePage.tsx
  - src/features/auth/pages/SettingsPage.tsx（MfaSetupSection + DisclosureSettings + プロファイル編集を統合）
  - src/features/auth/components/MfaSetupSection.tsx（Settings 内）
  - src/features/auth/components/DisclosureSettings.tsx（Settings 内、手動全解放）
  - ⚠️ 全認証ページのボタン・入力フィールド・フォームに `data-testid` を付与（Automation Friendly Code Rules 準拠）
  - 命名規則: `{component}-{element-role}`（例: `login-form-email-input`, `login-form-submit-button`, `signup-form-password-input`, `onboarding-form-nickname-input`, `settings-mfa-enable-button`, `settings-disclosure-unlock-all-button`）

- [x] Step 15: PWA 設定（US-25, US-26）
  - public/manifest.json（Web App Manifest）
  - src/sw.ts（Service Worker: Workbox precache + runtime cache。vite-plugin-pwa が vite.config.ts の VitePWA プラグイン設定に基づいて SW をビルド・注入）
  - src/lib/register-sw.ts（SW 登録）

- [x] Step 16: フロントエンドユニットテスト
  - tests/contexts/AuthContext.test.tsx
  - tests/contexts/DisclosureContext.test.tsx
  - tests/lib/api-client.test.ts
  - tests/features/shared/ProtectedRoute.test.tsx
  - tests/features/auth/LoginPage.test.tsx
  - tests/features/auth/SignupPage.test.tsx
  - tests/features/auth/OnboardingPage.test.tsx

- [x] Step 17: フロントエンド PBT
  - tests/pbt/language-switch.pbt.ts（Round-trip: ja→en→ja で元に戻る）
  - tests/pbt/taste-profile-init.pbt.ts（Invariant: 全6軸が 0.5）
  - tests/pbt/disclosure-level-init.pbt.ts（Invariant: sakeExperience → disclosureLevel マッピング）
  - tests/pbt/two-axis-mapping.pbt.ts（Invariant: 6軸 [0,1] → 2軸 [0,1] 範囲保証）
  - tests/pbt/zod-roundtrip.pbt.ts（Round-trip: Zod parse → serialize → parse が等価）

- [x] Step 18: フロントエンドコードサマリー
  - aidlc-docs/construction/unit1-foundation/code/frontend-summary.md

### Phase D: インフラ

- [x] Step 19: Terraform モジュール
  - infra/backend-setup/main.tf（S3 + DynamoDB bootstrap）
  - infra/modules/cognito/main.tf, variables.tf, outputs.tf
  - infra/modules/api-gateway/main.tf, variables.tf, outputs.tf（Gateway Response 7種含む）
  - infra/modules/dynamodb/main.tf, variables.tf, outputs.tf（5テーブル）
  - infra/modules/s3-cloudfront/main.tf, variables.tf, outputs.tf（ログバケット + ライフサイクル含む）
  - infra/modules/lambda-base/main.tf, variables.tf, outputs.tf
  - infra/modules/monitoring/main.tf, variables.tf, outputs.tf
  - ⚠️ CodePipeline / CodeBuild モジュールは Unit 6 (Infrastructure) で作成。Unit 1 では手動デプロイスクリプト（Step 23）で対応

- [x] Step 20: 環境別設定
  - infra/environments/dev/main.tf, variables.tf, terraform.tfvars, backend.tf
  - infra/environments/prod/main.tf, variables.tf, terraform.tfvars, backend.tf

- [x] Step 21: インフラコードサマリー
  - aidlc-docs/construction/unit1-foundation/code/infrastructure-summary.md

### Phase E: ドキュメント・デプロイ

- [x] Step 22: プロジェクトドキュメント
  - README.md 更新（プロジェクト概要、セットアップ手順、開発ガイド）
  - backend/README.md（API エンドポイント一覧、ローカル開発手順）
  - frontend/README.md（開発サーバー起動、ビルド手順）

- [x] Step 23: デプロイアーティファクト
  - buildspec.yml（CodeBuild 用ビルド仕様）
  - scripts/deploy-frontend.sh（S3 sync + CloudFront invalidation）
  - scripts/deploy-backend.sh（Lambda 関数更新）

---

## ストーリートレーサビリティ

| ストーリー | 実装ステップ | 状態 |
|---|---|---|
| US-01 | Step 2, 5, 8, 9, 14, 16 | [x] |
| US-02 | Step 2, 5, 14, 16 | [x] |
| US-02B | Step 2, 6, 8, 14, 16 | [x] |
| US-03 | Step 12, 16, 17 | [x] |
| US-25 | Step 11, 13, 15 | [x] |
| US-26 | Step 13, 15 | [x] |
| US-29 | Step 2, 7, 12, 14, 17 | [x] |
| US-30 | Step 2, 5, 14, 16, 17 | [x] |
