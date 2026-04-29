# SDLC — アプリケーション設計 統合ドキュメント

## 1. 設計判断サマリー

| 判断項目 | 選択 |
|---|---|
| フロントエンド設計パターン | Feature-based（機能単位ディレクトリ分割） |
| Lambda分割粒度 | エンドポイント単位（1 Lambda = 1 APIエンドポイント） |
| AI呼び出しパターン | プロンプトテンプレート管理（S3保存 + AIGateway経由） |
| フロントエンド状態管理 | React Context + useReducer |
| IaCツール | Terraform |

---

## 2. アーキテクチャ概要

### フロントエンド
- React 19 + TypeScript SPA（Vite ビルド）
- Feature-based ディレクトリ構成（9 Feature: Auth, Plan, Build, Test, Deploy, Monitor, Optimize, Discovery, Shared）
- React Context + useReducer による状態管理
- react-i18next による日英2言語対応
- PWA（Service Worker + Web App Manifest + プッシュ通知）
- S3 + CloudFront でホスティング

### バックエンド
- API Gateway (REST) + Cognito JWT Authorizer
- Lambda関数 29個（エンドポイント単位、Node.js/TypeScript）
- DynamoDB 6テーブル（Users, TasteProfiles, DrinkingLogs, SakenowaCache, UserTokens, NotificationSettings）
- AIGateway（Bedrock Claude呼び出し一元管理 + S3プロンプトテンプレート）
- SakenowaClient（さけのわAPI連携 + TTL 24hキャッシュ）

### 外部連携
- Amazon Bedrock Claude（テキスト推論 + Vision）
- さけのわデータAPI（7エンドポイント）
- Google Calendar API（OAuth 2.0）
- Web Push (VAPID)（プッシュ通知。Pinpoint は 2026-10-30 EoS のため不採用）

### インフラ
- Terraform によるIaC管理

---

## 3. コンポーネント一覧

### フロントエンド（9 Feature）
- FE-01: AuthFeature — 認証（US-01, US-02）
- FE-02: PlanFeature — 計画（US-04〜US-07）
- FE-03: BuildFeature — 構成・推薦（US-08〜US-11）
- FE-04: TestFeature — ペアリング（US-12, US-13）
- FE-05: DeployFeature — 実行記録（US-14〜US-16）
- FE-06: MonitorFeature — 観測（US-17, US-18）
- FE-07: OptimizeFeature — 最適化（US-19〜US-21）
- FE-08: DiscoveryFeature — 発見（US-22〜US-24）
- FE-09: SharedComponents — 共通（US-03, US-25〜US-27）

### バックエンド（9 Handler群 + 4 共通コンポーネント）
- BE-01〜BE-09: Lambda Handler群（29 Lambda関数）
- CM-01: AIGateway（Bedrock + S3テンプレート）
- CM-02: SakenowaClient（さけのわAPI + DynamoDBキャッシュ）
- CM-03: AuthMiddleware（Cognito JWT検証）
- CM-04: Logger（構造化ログ）

### サービス層（8サービス）
- SVC-01〜SVC-08: ビジネスロジックのオーケストレーション

---

## 4. 詳細ドキュメント参照

| ドキュメント | パス |
|---|---|
| コンポーネント定義 | `aidlc-docs/inception/application-design/components.md` |
| メソッド定義 | `aidlc-docs/inception/application-design/component-methods.md` |
| サービス定義 | `aidlc-docs/inception/application-design/services.md` |
| 依存関係 | `aidlc-docs/inception/application-design/component-dependency.md` |
