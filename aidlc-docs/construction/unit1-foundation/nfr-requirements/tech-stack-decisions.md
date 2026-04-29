# Unit 1: Foundation — 技術スタック決定

---

## フロントエンド

| 技術 | バージョン | 選定理由 |
|---|---|---|
| React | 19.x | UIフレームワーク。エコシステムの成熟度、将来のネイティブアプリ移行パス |
| TypeScript | 5.x | 型安全性。PBT のジェネレーター定義にも必須 |
| Vite | 6.x | 高速ビルド、Tree-shaking、コード分割。200KB目標達成に寄与 |
| React Router | 7.x | SPA ルーティング。タブナビゲーション実装 |
| react-i18next | 15.x | 多言語対応。namespace分割、遅延ロード対応 |
| Workbox | 7.x | PWA Service Worker。事前キャッシュ、ランタイムキャッシュ、バックグラウンド同期 |
| Zod | 3.x | スキーマバリデーション（FE/BE共有型定義） |

### バンドル最適化方針
- React.lazy + Suspense: Feature 単位の遅延ロード（auth, plan, build, test, deploy, monitor, optimize, discovery）
- 初期ロードに含めるもの: SharedComponents（AppShell, TabBar, ProtectedRoute）+ AuthFeature のみ
- 他の Feature は初回アクセス時にオンデマンドロード

---

## バックエンド

| 技術 | バージョン | 選定理由 |
|---|---|---|
| Node.js | 22.x LTS | Lambda ランタイム。TypeScript との親和性 |
| TypeScript | 5.x | FE と型定義を共有。monorepo 構成で共通型パッケージ |
| esbuild | 0.24.x | Lambda バンドル。高速ビルド、Tree-shaking、コールドスタート削減 |
| @aws-sdk/client-dynamodb | 3.x | DynamoDB アクセス。v3 モジュラーインポートでバンドルサイズ削減 |
| @aws-sdk/client-cognito-identity-provider | 3.x | Cognito 管理操作 |
| Zod | 3.x | API 入力バリデーション（SECURITY-05 準拠） |
| pino | 9.x | 構造化ログ（JSON出力、SECURITY-03 準拠） |

---

## インフラ

| 技術 | バージョン | 選定理由 |
|---|---|---|
| Terraform | 1.9.x | IaC。宣言的、状態管理、モジュール化 |
| AWS Provider | 5.x | AWS リソース管理 |

### Terraform モジュール構成（Unit 1 スコープ）
| モジュール | リソース |
|---|---|
| cognito | User Pool, App Client, Identity Pool, MFA設定, Pre Sign-up Lambda Trigger |
| api-gateway | REST API, Cognito Authorizer, ステージ, スロットリング設定, アクセスログ |
| dynamodb | 6テーブル（スキーマ定義、暗号化、ポイントインタイムリカバリ） |
| s3-cloudfront | SPA ホスティングバケット, CloudFront Distribution, OAC, セキュリティヘッダー |
| lambda-base | 共通 Lambda Layer, IAM ロール, CloudWatch ロググループ（180日保持） |
| monitoring | CloudWatch アラーム（認証失敗、5xx エラー、Lambda エラー率）, SNS トピック |

---

## テスト

| 技術 | バージョン | 選定理由 |
|---|---|---|
| Vitest | 3.x | テストランナー。Vite ネイティブ、高速、TypeScript 対応 |
| fast-check | 3.x | PBT フレームワーク（PBT-09 準拠）。カスタムジェネレーター、シュリンキング、シード再現性 |
| @testing-library/react | 16.x | React コンポーネントテスト。アクセシビリティ重視のクエリ |
| msw | 2.x | API モック（Service Worker ベース） |

### PBT フレームワーク設定（PBT-08, PBT-09 準拠）
```typescript
// vitest.config.ts での fast-check 設定
// シード: CI では固定シード、ローカルではランダム
// シュリンキング: 有効（デフォルト）
// 実行回数: 100（デフォルト）
```

---

## monorepo 構成

```
/
├── packages/
│   └── shared-types/        # FE/BE 共有型定義（Zod スキーマ含む）
├── frontend/                # React SPA
├── backend/                 # Lambda 関数群
├── infra/                   # Terraform
└── prompts/                 # AI プロンプトテンプレート
```

- `shared-types`: User, TasteProfile, DrinkingLog 等のドメイン型と Zod スキーマを FE/BE で共有
- CM-01/CM-02 のインターフェース定義もここに配置（Unit 1 で定義、Unit 2/3 で本実装）
