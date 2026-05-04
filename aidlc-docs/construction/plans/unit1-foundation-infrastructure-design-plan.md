# Unit 1: Foundation — Infrastructure Design 計画

---

## 計画概要

NFR Design で定義された論理コンポーネントを AWS インフラサービスにマッピングし、Terraform モジュール構成と環境別デプロイアーキテクチャを設計する。

### 成果物
1. `infrastructure-design.md` — インフラ設計（AWS サービスマッピング、Terraform モジュール詳細、環境別設定）
2. `deployment-architecture.md` — デプロイアーキテクチャ（環境構成、CI/CD パイプライン概要、環境変数管理）

### 前ステージからの持ち越しリマインダー
- [x] Inception 正本同期: テーブル数 6→5、Lambda 数 31、SakenowaCache PITR 無効
- [x] components.md CM-02 に「DynamoDBキャッシュ = SakenowaCache テーブル」明示
- [x] cognito-daily-backup Lambda を components.md BE-01 に追加、application-design.md Lambda 数同期
- [x] Gateway Response 7種を api-gateway モジュールで具体化

---

## 実行ステップ

### Part 1: 質問収集
- [x] Step 1: 設計成果物の分析（Functional Design + NFR Design）
- [x] Step 2: 質問ファイル作成・回答収集
- [x] Step 3: 回答分析・曖昧点解消（矛盾なし、全回答明確）

### Part 2: 成果物生成
- [x] Step 4: infrastructure-design.md 作成
  - [x] 4a: Cognito モジュール詳細（User Pool, App Client, MFA, Pre Sign-up Trigger, Advanced Security）
  - [x] 4b: API Gateway モジュール詳細（REST API, Authorizer, ステージ, スロットリング, Gateway Response, CORS, アクセスログ）
  - [x] 4c: DynamoDB モジュール詳細（5テーブル、GSI、暗号化、PITR、TTL）
  - [x] 4d: S3 + CloudFront モジュール詳細（SPA ホスティング, OAC, Response Headers Policy）
  - [x] 4e: Lambda 基盤モジュール詳細（Layer, IAM ロール, ロググループ, SnapStart）
  - [x] 4f: 監視モジュール詳細（CloudWatch アラーム, SNS, X-Ray）
  - [x] 4g: 環境変数・シークレット管理
- [x] Step 5: deployment-architecture.md 作成
  - [x] 5a: 環境構成（dev / prod）
  - [x] 5b: Terraform ワークスペース / バックエンド設定
  - [x] 5c: CI/CD パイプライン概要
  - [x] 5d: デプロイ手順
- [x] Step 6: Inception 正本同期（持ち越しリマインダー消化）
- [x] Step 7: SECURITY-01〜15 準拠検証
- [x] Step 8: 完了メッセージ提示・承認待ち
