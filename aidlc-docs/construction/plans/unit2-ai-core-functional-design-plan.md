# Unit 2: AI Core — Functional Design 計画

---

## 計画概要

Unit 2 は SDLC の核心機能「AI 推薦・判定」を担当する。CM-01 AIGateway の本実装（Bedrock Claude 接続）と、推薦・判定のビジネスロジックを設計する。

### 成果物
1. `domain-entities.md` — ドメインエンティティ（PlanInput, Recommendation, DontDeployResult 等）
2. `business-rules.md` — ビジネスルール（推薦ロジック、Don't Deploy 判定基準、コスト制御）
3. `business-logic-model.md` — ビジネスロジックモデル（推薦フロー、判定フロー、メタ応答フロー）
4. `frontend-components.md` — フロントエンドコンポーネント（PlanFeature, BuildFeature）

---

## 実行ステップ

### Part 1: 質問収集
- [x] Step 1: Unit 2 コンテキスト分析（ストーリー、依存関係、IF 確認）
- [x] Step 2: 質問ファイル作成・回答収集
- [x] Step 3: 回答分析・曖昧点解消（矛盾なし、全回答明確）

### Part 2: 成果物生成
- [x] Step 4: domain-entities.md 作成
- [x] Step 5: business-rules.md 作成
- [x] Step 6: business-logic-model.md 作成
- [x] Step 7: frontend-components.md 作成
- [x] Step 8: SECURITY / PBT 準拠検証
- [x] Step 9: 完了メッセージ提示・承認待ち
