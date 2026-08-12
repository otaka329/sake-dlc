# Unit 2: AI Core — NFR Design 計画

---

## 計画概要

NFR Requirements で定義された AI 推論のパフォーマンス・コスト・可用性要件を、具体的な設計パターンと論理コンポーネントに落とし込む。

### 成果物
1. `nfr-design-patterns.md` — NFR 設計パターン（AI 推論パイプライン、キャッシュ、リトライ、コスト制御）
2. `logical-components.md` — 論理コンポーネント（AIGateway 内部構造、プロンプトパイプライン、キャッシュ層）

---

## 実行ステップ

### Part 1: 質問収集
- [x] Step 1: NFR Requirements 成果物の分析
- [x] Step 2: 質問ファイル作成・回答収集
- [x] Step 3: 回答分析・曖昧点解消（矛盾なし。Q3=B により BL-17 matchScore 算出が AI 側に移行）

### Part 2: 成果物生成
- [x] Step 4: NFR 設計パターン（nfr-design-patterns.md）作成
  - [x] 4a: AI 推論パイプライン（テンプレート取得 → 変数置換 → Bedrock 呼び出し → パース → キャッシュ保存）
  - [x] 4b: キャッシュ戦略（ハッシュ生成、TTL、ヒット判定）
  - [x] 4c: リトライ・フォールバック（パース失敗、Bedrock 障害）
  - [x] 4d: コスト制御（回数制限、メトリクス、アラーム）
  - [x] 4e: プロンプトインジェクション防止パターン
- [x] Step 5: 論理コンポーネント（logical-components.md）作成
  - [x] 5a: AIGateway 内部モジュール構成
  - [x] 5b: RecommendationService / DontDeployService 構造
  - [x] 5c: フロントエンド PlanContext / BuildPage 連携
  - [x] 5d: インフラ（Bedrock IAM、Lambda 環境変数、Terraform Custom Resource）
- [x] Step 6: SECURITY / PBT 準拠検証
- [x] Step 7: 完了メッセージ提示・承認待ち
