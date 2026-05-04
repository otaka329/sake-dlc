# SDLC — ユニット定義

## 分解方針
- 粒度: 中程度（6ユニット）
- FE/BE統合: ハイブリッド（共通基盤は分離、機能はドメインごとにFE+BE統合）
- 開発順序: 並行開発（Unit 1を先行、残りは並行）

---

## Unit 1: Foundation（共通基盤）
**開発順序**: 最初に着手（他ユニットの前提）

| 項目 | 内容 |
|---|---|
| 責務 | インフラ基盤、認証、共通コンポーネント、共有インターフェース定義、フロントエンド骨格 |
| FEコンポーネント | FE-01 (AuthFeature), FE-09 (SharedComponents) |
| BEコンポーネント | BE-01 (AuthHandlers), CM-01 (AIGateway インターフェース定義＋スタブ), CM-02 (SakenowaClient インターフェース定義＋スタブ), CM-03 (AuthMiddleware), CM-04 (Logger) |
| インフラ | Terraform基盤（API Gateway, Cognito, DynamoDB 全6テーブルスキーマ定義, S3, CloudFront, Lambda共通設定） |
| DynamoDBテーブル | 全6テーブルの Terraform スキーマ定義のみ（Users, TasteProfiles, DrinkingLogs, SakenowaCache, UserTokens, NotificationSettings）。データアクセスロジック（CRUD実装）は各オーナーユニットが担当 |
| 関連ストーリー | US-01, US-02, US-02B, US-03, US-25, US-26, US-29, US-30 |

### コード構成
```
/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/           # FE-01
│   │   │   └── shared/         # FE-09
│   │   ├── contexts/           # React Context
│   │   ├── i18n/               # 多言語リソース
│   │   ├── hooks/              # 共通Hooks
│   │   ├── types/              # 型定義
│   │   └── utils/              # ユーティリティ
│   ├── public/                 # PWA manifest, icons
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   └── auth/           # BE-01
│   │   ├── middleware/         # CM-03
│   │   ├── lib/               # 共通ライブラリ
│   │   │   └── logger.ts      # CM-04
│   │   └── types/             # 共通型定義
│   ├── package.json
│   └── tsconfig.json
├── infra/                      # Terraform
│   ├── modules/
│   │   ├── api-gateway/
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── s3-cloudfront/
│   │   └── lambda-base/
│   ├── environments/
│   │   ├── dev/
│   │   └── prod/
│   └── main.tf
└── prompts/                    # AIプロンプトテンプレート（S3にデプロイ）
```

---

## Unit 2: AI Core（AI推薦・判定）
**開発順序**: Unit 1完了後、並行開発可能（CM-01 AIGateway インターフェースと CM-02 SakenowaClient インターフェースは Unit 1 で先行確定済み。Unit 2 では CM-01 の本実装を担当）

| 項目 | 内容 |
|---|---|
| 責務 | 日本酒推薦、Don't Deploy Today判定、メタ応答、AIGateway本実装 |
| FEコンポーネント | FE-02 (PlanFeature), FE-03 (BuildFeature) |
| BEコンポーネント | BE-02 (RecommendationHandlers), CM-01 (AIGateway 本実装) |
| サービス | SVC-01 (RecommendationService), SVC-02 (DontDeployService) |
| インフラ | Bedrock接続設定, S3プロンプトバケット, Lambda関数（post-recommend, post-dont-deploy, post-meta-response） |
| DynamoDBテーブル | TasteProfiles（読み取り） |
| 関連ストーリー | US-04, US-06, US-08, US-09, US-10, US-11, US-16 |

---

## Unit 3: Pairing & Discovery（ペアリング・発見）
**開発順序**: Unit 1完了後、並行開発可能（CM-02 SakenowaClient インターフェースは Unit 1 で先行確定済み。Unit 3 では CM-02 の本実装を担当。Unit 2 は CM-02 のインターフェースのみ利用するため待ちなし）

| 項目 | 内容 |
|---|---|
| 責務 | ペアリング提案（テキスト/画像）、酒蔵・銘柄ブラウジング、学習コンテンツ、さけのわクライアント本実装 |
| FEコンポーネント | FE-04 (TestFeature), FE-08 (DiscoveryFeature) |
| BEコンポーネント | BE-03 (PairingHandlers), BE-06 (DiscoveryHandlers), BE-09 (SakenowaSync), CM-02 (SakenowaClient 本実装) |
| サービス | SVC-03 (PairingService), SVC-06 (DiscoveryService) |
| インフラ | S3画像アップロードバケット, Lambda関数群, EventBridge（さけのわ同期スケジュール） |
| DynamoDBテーブル | SakenowaCache |
| 関連ストーリー | US-07, US-12, US-13, US-22, US-23, US-24 |

---

## Unit 4: Lifecycle Tracking（記録・グラフ）
**開発順序**: Unit 1完了後、並行開発可能（DynamoDB DrinkingLogs / TasteProfiles テーブルスキーマは Unit 1 で先行定義済み。CM-02 SakenowaClient インターフェースも Unit 1 で確定済みのため待ちなし。Unit 5 は DrinkingLogs テーブルを読み取るが、スキーマは共有済み）

| 項目 | 内容 |
|---|---|
| 責務 | 飲酒/非飲酒記録、翌朝記録、味覚プロファイル管理、履歴表示、新銘柄発見 |
| FEコンポーネント | FE-05 (DeployFeature), FE-06 (MonitorFeature), FE-07 (OptimizeFeature) |
| BEコンポーネント | BE-04 (DrinkingLogHandlers), BE-05 (TasteGraphHandlers) |
| サービス | SVC-04 (DrinkingLogService), SVC-05 (TasteGraphService) |
| インフラ | Lambda関数群 |
| DynamoDBテーブル | DrinkingLogs, TasteProfiles（読み書き） |
| 関連ストーリー | US-14, US-15, US-17, US-19, US-20, US-21, US-28 |

---

## Unit 5: External Integration（外部連携）
**開発順序**: Unit 1完了後、並行開発可能（DrinkingLogs テーブルスキーマは Unit 1 で先行定義済み。Unit 4 の実装完了を待たずに通知ロジックの開発が可能）

| 項目 | 内容 |
|---|---|
| 責務 | Google Calendar連携、プッシュ通知、飲酒終了リマインド |
| FEコンポーネント | FE-02 (PlanFeature — カレンダー連携部分), FE-06 (MonitorFeature — 通知部分) |
| BEコンポーネント | BE-07 (CalendarHandlers), BE-08 (NotificationHandlers) |
| サービス | SVC-07 (CalendarService), SVC-08 (NotificationService) |
| インフラ | Google OAuth設定, EventBridge（通知スケジュール）, VAPID鍵管理（SSM Parameter Store） |
| DynamoDBテーブル | UserTokens（Google OAuth）, NotificationSettings |
| 関連ストーリー | US-05, US-18, US-27 |

---

## Unit 6: Infrastructure（インフラ統合）
**開発順序**: Unit 1と並行で着手可能、他ユニットのインフラ要件を統合

| 項目 | 内容 |
|---|---|
| 責務 | Terraform全体統合、環境別設定、CI/CD、監視・ログ |
| コンポーネント | Terraform modules統合、CloudWatch設定、アラート設定 |
| インフラ | 全AWSリソースのTerraform定義統合、環境変数管理、デプロイパイプライン |
| 関連ストーリー | （直接のストーリーなし — 全ストーリーの基盤） |
