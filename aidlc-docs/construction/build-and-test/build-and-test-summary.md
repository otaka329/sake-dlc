# Build and Test サマリー — Unit 1 Foundation

## ビルドステータス

| 項目 | 状態 | 備考 |
|---|---|---|
| ビルドツール | Vite 6.x（FE）、esbuild 0.24.x（BE）、Terraform 1.9.x | — |
| 依存関係 | npm ci（monorepo ワークスペース） | — |
| 型チェック | TypeScript 5.7.x strict mode | shared-types, backend, frontend |
| リント | ESLint + Prettier | — |
| バックエンドビルド | esbuild バンドル（Lambda 10関数） | dist/handlers/auth/*.mjs |
| フロントエンドビルド | Vite SPA ビルド | dist/ (index.html + assets/) |
| インフラ | Terraform 6モジュール | init → plan → apply |

## テスト実行サマリー

### ユニットテスト

| パッケージ | テストファイル数 | PBT ファイル数 | 状態 |
|---|---|---|---|
| backend | 13 | 7 | 実行待ち |
| frontend | 7 | 5 | 実行待ち |
| **合計** | **20** | **12** | — |

### 統合テスト

| シナリオ | 対象 | 状態 |
|---|---|---|
| ユーザー登録フロー | signup → Users + TasteProfiles | 実行待ち |
| プロファイル取得・更新 | get-profile, put-profile | 実行待ち |
| 開示レイヤー更新 | put-disclosure-level（冪等性検証） | 実行待ち |
| レート制限 | 100 req → 成功、101 req → 429 | 実行待ち |
| MFA フロー | setup → verify → recovery-codes → delete | 実行待ち |

### パフォーマンステスト

| 指標 | 目標 | 状態 |
|---|---|---|
| バンドルサイズ（gzip） | < 200KB | 実行待ち |
| LCP | < 2秒 | 実行待ち |
| API 応答時間（CRUD） | < 200ms | 実行待ち |
| API 応答時間（認証系） | < 500ms | 実行待ち |
| Lambda コールドスタート | < 3秒 | 実行待ち |

## セキュリティテスト

| テスト | 方法 | 状態 |
|---|---|---|
| 依存関係脆弱性スキャン | `npm audit` | 実行待ち |
| OWASP Top 10 チェック | SECURITY-01〜15 準拠（設計レビュー済み） | 設計準拠確認済み |
| ブロックリスト照合 | フロントエンド HIBP k-anonymity テスト | 実行待ち |
| レート制限 | 固定ウィンドウ 100 req/min テスト | 実行待ち |
| CORS | ワイルドカード禁止、環境別オリジン | 設計準拠確認済み |

## PBT 準拠サマリー（PBT-08）

| 項目 | 設定 |
|---|---|
| フレームワーク | fast-check 3.x |
| シュリンキング | 有効 |
| シード再現性 | CI: 固定シード、ローカル: ランダム |
| CI 統合 | buildspec.yml に含む |
| ジェネレーター | ドメイン固有（user.ts, password.ts） |

## 生成ドキュメント

| ファイル | 内容 |
|---|---|
| build-instructions.md | ビルド手順（前提条件、環境変数、ステップ、トラブルシューティング） |
| unit-test-instructions.md | ユニットテスト実行手順（テスト一覧、カバレッジ目標、PBT 設定） |
| integration-test-instructions.md | 統合テスト手順（5シナリオ、DynamoDB Local セットアップ） |
| performance-test-instructions.md | パフォーマンステスト手順（k6、Lighthouse、バンドル分析） |
| build-and-test-summary.md | 本ファイル |

## 次のステップ

1. `npm ci` で依存関係をインストール
2. `npm run test` でユニットテスト + PBT を実行
3. カバレッジ目標（ステートメント 80%、ブランチ 70%）を確認
4. DynamoDB Local で統合テストを実行
5. `npm run build` でビルド成功を確認
6. Lighthouse でフロントエンドパフォーマンスを確認
7. dev 環境に Terraform apply + デプロイ
8. dev 環境で k6 負荷テストを実行
