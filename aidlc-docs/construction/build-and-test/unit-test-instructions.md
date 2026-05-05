# ユニットテスト実行手順

## テストフレームワーク

| ツール | バージョン | 用途 |
|---|---|---|
| Vitest | 3.x | テストランナー（バックエンド + フロントエンド） |
| fast-check | 3.x | プロパティベーステスト（PBT） |
| @testing-library/react | 16.x | React コンポーネントテスト |
| jsdom | 25.x | ブラウザ環境シミュレーション（フロントエンド） |

## テスト実行

### 1. 全テスト実行

```bash
# バックエンド
cd backend
npm run test

# フロントエンド
cd frontend
npm run test
```

### 2. カバレッジ付き実行

```bash
# バックエンド
cd backend
npm run test:coverage

# フロントエンド
cd frontend
npm run test:coverage
```

### 3. 特定テストのみ実行

```bash
# バックエンド — 特定ファイル
cd backend
npx vitest run tests/handlers/auth/signup.test.ts

# バックエンド — PBT のみ
cd backend
npx vitest run tests/pbt/

# フロントエンド — Context テストのみ
cd frontend
npx vitest run tests/contexts/
```

## テスト一覧

### バックエンド ユニットテスト（13ファイル）

| ファイル | テスト対象 | テスト数（概算） |
|---|---|---|
| tests/lib/errors.test.ts | エラー階層 6クラス | 8 |
| tests/lib/response.test.ts | レスポンスヘルパー | 4 |
| tests/middleware/create-handler.test.ts | 共通ハンドラーラッパー | 4 |
| tests/middleware/rate-limiter.test.ts | レート制限 | 4 |
| tests/handlers/auth/signup.test.ts | POST /signup | 4 |
| tests/handlers/auth/get-profile.test.ts | GET /profile | 2 |
| tests/handlers/auth/put-profile.test.ts | PUT /profile バリデーション | 7 |
| tests/handlers/auth/put-disclosure-level.test.ts | PUT /disclosure-level バリデーション | 8 |
| tests/handlers/auth/pre-signup.test.ts | ブロックリスト照合 | 6 |
| tests/handlers/auth/mfa-setup.test.ts | MFA セットアップ | 1 |
| tests/handlers/auth/mfa-verify.test.ts | MFA 検証バリデーション | 5 |
| tests/handlers/auth/delete-mfa.test.ts | MFA 無効化バリデーション | 4 |
| tests/handlers/auth/recovery-codes.test.ts | リカバリーコード生成 | 3 |

### バックエンド PBT（8ファイル）

| ファイル | プロパティ | PBT ルール |
|---|---|---|
| tests/pbt/password-validation.pbt.ts | 15文字以上で合格、14文字以下で不合格 | PBT-03 |
| tests/pbt/nickname-validation.pbt.ts | 2-20文字英数字で合格 | PBT-03 |
| tests/pbt/email-validation.pbt.ts | RFC 5322 準拠で合格 | PBT-03 |
| tests/pbt/disclosure-level.pbt.ts | 単調増加 Invariant | PBT-03 |
| tests/pbt/rate-limiter.pbt.ts | 上限未満→許可、上限以上→拒否 | PBT-03 |
| tests/pbt/error-response.pbt.ts | 全エラーが { code, message } 構造 | PBT-03 |
| tests/pbt/pii-mask.pbt.ts | マスク後に平文 PII なし | PBT-03 |
| tests/pbt/generators/user.ts | ドメインジェネレーター | PBT-07 |
| tests/pbt/generators/password.ts | パスワードジェネレーター | PBT-07 |

### フロントエンド ユニットテスト（7ファイル）

| ファイル | テスト対象 | テスト数（概算） |
|---|---|---|
| tests/contexts/AuthContext.test.tsx | 認証状態管理 | 3 |
| tests/contexts/DisclosureContext.test.tsx | 開示レイヤー管理 | 6 |
| tests/lib/token-storage.test.ts | トークンストレージ | 4 |
| tests/features/shared/ProtectedRoute.test.tsx | 認証ガード | 3 |
| tests/features/auth/LoginPage.test.tsx | ログインページ | 4 |
| tests/features/auth/SignupPage.test.tsx | サインアップページ | 3 |
| tests/features/auth/OnboardingPage.test.tsx | オンボーディングページ | 3 |

### フロントエンド PBT（5ファイル）

| ファイル | プロパティ | PBT ルール |
|---|---|---|
| tests/pbt/language-switch.pbt.ts | Round-trip: ja→en→ja | PBT-02 |
| tests/pbt/taste-profile-init.pbt.ts | 全6軸が 0.5 | PBT-03 |
| tests/pbt/disclosure-level-init.pbt.ts | sakeExperience → disclosureLevel マッピング | PBT-03 |
| tests/pbt/two-axis-mapping.pbt.ts | 6軸 [0,1] → 2軸 [0,1] 範囲保証 | PBT-03 |
| tests/pbt/zod-roundtrip.pbt.ts | parse → serialize → parse 等価 | PBT-02 |

## カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| ステートメントカバレッジ | 80% 以上 | NFR Requirements §8 |
| ブランチカバレッジ | 70% 以上 | NFR Requirements §8 |
| ビジネスルール（BR-01〜BR-07） | 100% | 例示ベース + PBT |

## PBT 設定（PBT-08 準拠）

| 設定 | 値 | 根拠 |
|---|---|---|
| シュリンキング | 有効（デフォルト） | PBT-08: 最小再現ケース |
| 実行回数 | 100（デフォルト） | — |
| シード | CI: 固定シード、ローカル: ランダム | PBT-08: 再現性 |
| CI 統合 | buildspec.yml に含む | PBT-08: CI パイプライン |

## テスト失敗時の対応

1. テスト出力でエラーメッセージを確認
2. PBT 失敗の場合: シード値とシュリンクされた最小入力を確認
3. コードを修正
4. 再実行して全テストがパスすることを確認
5. PBT で発見された失敗ケースは例示ベーステストとして追加（PBT-10）
