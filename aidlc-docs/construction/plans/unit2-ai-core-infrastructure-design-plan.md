# Unit 2: AI Core — Infrastructure Design 計画

---

## 計画概要

Unit 1 で構築済みのインフラ基盤（API Gateway, DynamoDB, Lambda Layer）に対し、Unit 2 固有のリソース（Bedrock IAM、Lambda 関数3本、Terraform Custom Resource プロンプトシード）を追加設計する。

### 成果物
1. `infrastructure-design.md` — インフラ設計（Bedrock 接続、Lambda 関数、IAM、API Gateway エンドポイント追加）
2. `deployment-architecture.md` — デプロイアーキテクチャ（Unit 2 固有の追加設定、環境変数）

---

## 実行ステップ

### Part 1: 質問収集
- [x] Step 1: NFR Design 成果物の分析
- [x] Step 2: 質問ファイル作成・回答収集
- [x] Step 3: 回答分析・曖昧点解消（矛盾なし）

### Part 2: 成果物生成
- [x] Step 4: infrastructure-design.md 作成
- [x] Step 5: deployment-architecture.md 作成
- [x] Step 6: SECURITY 準拠検証
- [x] Step 7: 完了メッセージ提示・承認待ち
