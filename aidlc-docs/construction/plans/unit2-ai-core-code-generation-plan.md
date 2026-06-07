# Unit 2: AI Core — Code Generation 計画

---

## ユニットコンテキスト

### 実装対象ストーリー
| ストーリー | タイトル | 優先度 |
|---|---|---|
| US-04 | 体調・予定の入力 | Must |
| US-06 | 料理の入力（テキスト） | Must |
| US-08 | AI日本酒推薦 | Must |
| US-09 | Don't Deploy Today判定 | Must |
| US-10 | ノンアル代替提案 | Should |
| US-11 | 推薦結果のカスタマイズ | Should |
| US-16 | メタ応答 | Should |

### 依存関係
- Unit 1 構築済み: API Gateway, DynamoDB (AppData, Users, TasteProfiles, SakenowaCache), Lambda Layer, 共通ミドルウェア
- CM-01 AIGateway: Unit 1 でスタブ実装済み → Unit 2 で本実装に差し替え
- CM-02 SakenowaClient: Unit 1 でスタブ実装済み → Unit 2 は読み取りのみ使用（本実装は Unit 3）
- **SakenowaCache データ**: Unit 3 BE-09 SakenowaSync が投入。Unit 2 時点ではキャッシュ空 + SakenowaClient スタブのため、recommend の実 flavorData/flavorScores は Unit 3 まで本物にならない。テスト・ドライランはスタブ/モックデータ前提
- **AIGatewayRequest/Response 型**: `packages/shared-types/src/ai-gateway.ts` に定義済み（Unit 1）。本実装（`backend/src/lib/ai-gateway/`）はこの型契約を import して使用。型定義の所在は shared-types に維持（FE からも参照するため）

---

## コード生成ステップ

### Phase A: 共有型 + AIGateway 本実装

- [x] Step 1: shared-types に Unit 2 ドメインスキーマ追加
  - packages/shared-types/src/schemas/plan-input.ts（PlanInput, DishInput の Zod スキーマ）
  - packages/shared-types/src/schemas/recommendation.ts（Recommendation, TemperatureRecommendation, FlavorScores, RecommendationResponse の Zod スキーマ）
  - packages/shared-types/src/schemas/deploy-advice.ts（DeployAdvice, AlternativeProposal の Zod スキーマ）
  - packages/shared-types/src/schemas/meta-response.ts（MetaResponse の Zod スキーマ）
  - packages/shared-types/src/schemas/prompt-template.ts（PromptTemplate の Zod スキーマ）
  - packages/shared-types/src/types/dish-category.ts（料理カテゴリ enum: sashimi, grilled_fish, simmered, fried, meat, vegetable, nabe, dessert + other。8カテゴリ + フォールバック値 other に統一）
  - packages/shared-types/src/index.ts 更新（新スキーマの re-export 追加）

- [x] Step 2: AIGateway コアモジュール
  - backend/src/lib/ai-gateway/index.ts（ファサード: invoke メソッド + ドライランモード分岐）
  - backend/src/lib/ai-gateway/template-manager.ts（DynamoDB Query テンプレート取得 + 変数置換 + 未置換検証）
  - backend/src/lib/ai-gateway/bedrock-invoker.ts（Bedrock InvokeModel Tool Use 呼び出し + タイムアウト）
  - backend/src/lib/ai-gateway/response-parser.ts（Tool Use 出力 Zod バリデーション + リトライ判定）
  - backend/src/lib/ai-gateway/cache-manager.ts（キャッシュキー正規化・生成 + DynamoDB 読み書き。料理カテゴリは shared-types の enum を使用）
  - backend/src/lib/ai-gateway/cost-controller.ts（推薦回数制限アトミック UpdateItem + コスト計装メトリクス）

- [x] Step 3: Tool Use スキーマ定義
  - backend/src/lib/ai-gateway/schemas/recommend-tool.ts（推薦 Tool Use input_schema: minItems:3, maxItems:5, matchScore [0,1] 等）
  - backend/src/lib/ai-gateway/schemas/dont-deploy-tool.ts（判定 Tool Use input_schema）
  - backend/src/lib/ai-gateway/schemas/meta-response-tool.ts（メタ応答 Tool Use input_schema）
  - backend/src/lib/ai-gateway/schemas/alternative-tool.ts（代替提案 Tool Use input_schema）

### Phase B: バックエンド Lambda ハンドラー

- [x] Step 4: RecommendationService + ハンドラー（US-08, US-11）
  - backend/src/services/recommendation-service.ts（BL-11: キャッシュ判定 → AI推薦 → flavorScores Lambda付与 via SakenowaCache）
  - backend/src/handlers/ai/recommend.ts（POST /recommend: 回数制限 → RecommendationService → レスポンス）

- [x] Step 5: DontDeployService + ハンドラー（US-09, US-10）
  - backend/src/services/dont-deploy-service.ts（BL-12: ルールベース Phase 1 → AI判定 Phase 2 → 代替提案 BL-13）
  - backend/src/handlers/ai/dont-deploy.ts（POST /dont-deploy）

- [x] Step 6: MetaResponseService + ハンドラー（US-16）
  - backend/src/services/meta-response-service.ts（BL-14: パターン検出 → AI メタ応答）
  - backend/src/handlers/ai/meta-response.ts（POST /meta-response）

- [ ] Step 7: プロンプトシーダー
  - backend/src/handlers/ai/seed-prompts.ts（Custom Resource Lambda: テンプレート本文をバンドルから読み込み + DynamoDB 投入）
  - backend/src/handlers/ai/prompt-bodies/recommend.txt（推薦プロンプト本文）
  - backend/src/handlers/ai/prompt-bodies/dont-deploy.txt（判定プロンプト本文）
  - backend/src/handlers/ai/prompt-bodies/alternative-proposal.txt（代替提案プロンプト本文）
  - backend/src/handlers/ai/prompt-bodies/meta-response.txt（メタ応答プロンプト本文）
  - ⚠️ シーダーはプロンプト本文ファイルを esbuild バンドルに含め、templateId でファイルを読み取り DynamoDB に投入する設計（案A）

- [ ] Step 8: バックエンドユニットテスト
  - backend/tests/lib/ai-gateway/template-manager.test.ts
  - backend/tests/lib/ai-gateway/cache-manager.test.ts
  - backend/tests/lib/ai-gateway/cost-controller.test.ts
  - backend/tests/lib/ai-gateway/response-parser.test.ts
  - backend/tests/services/recommendation-service.test.ts
  - backend/tests/services/dont-deploy-service.test.ts
  - backend/tests/services/meta-response-service.test.ts
  - backend/tests/handlers/ai/recommend.test.ts
  - backend/tests/handlers/ai/dont-deploy.test.ts
  - backend/tests/handlers/ai/meta-response.test.ts

- [ ] Step 9: バックエンド PBT
  - backend/tests/pbt/cache-key-generation.pbt.ts（Invariant: 同一入力→同一キー、disclosureLevel/locale差→異キー）
  - backend/tests/pbt/match-score-range.pbt.ts（Invariant: [0,1] 範囲）
  - backend/tests/pbt/daily-usage-counter.pbt.ts（Invariant: 0〜3、3超過で拒否）
  - backend/tests/pbt/dont-deploy-rules.pbt.ts（Invariant: 服薬あり→常にSkipDeploy）
  - backend/tests/pbt/template-substitution.pbt.ts（Invariant: 置換後に {{}} 残らない）
  - backend/tests/pbt/recommendation-count.pbt.ts（Invariant: recommendations は 3〜5件）
  - backend/tests/pbt/cost-metrics-non-negative.pbt.ts（Invariant: inputTokens/outputTokens/latencyMs ≥ 0）

- [ ] Step 10: バックエンドコードサマリー
  - aidlc-docs/construction/unit2-ai-core/code/backend-summary.md

### Phase C: フロントエンド

- [ ] Step 11: PlanContext + PlanPage + API 統合（US-04, US-06）
  - frontend/src/contexts/PlanContext.tsx（PlanState + useReducer + デバウンス dont-deploy 自動呼び出し）
  - frontend/src/features/plan/pages/PlanPage.tsx
  - frontend/src/features/plan/components/ConditionCard.tsx
  - frontend/src/features/plan/components/ScheduleCard.tsx
  - frontend/src/features/plan/components/DishCard.tsx（サジェスト付き、shared-types の DishCategory enum 使用）
  - frontend/src/features/plan/components/MoodCard.tsx
  - frontend/src/features/plan/components/DeployAdviceDisplay.tsx
  - frontend/src/features/plan/data/dish-suggestions.ts（静的カテゴリリスト BR-15。shared-types の DishCategory を使用）
  - frontend/src/features/plan/hooks/useDontDeploy.ts（1秒デバウンス + POST /dont-deploy 呼び出し）
  - frontend/src/features/plan/api/plan-api.ts（apiClient ラッパー: postDontDeploy）

- [ ] Step 12: BuildPage + API 統合（US-08, US-09, US-10, US-11, US-16）
  - frontend/src/features/build/pages/BuildPage.tsx
  - frontend/src/features/build/components/RecommendationList.tsx
  - frontend/src/features/build/components/RecommendationCard.tsx（Layer別表示 + カスタマイズ）
  - frontend/src/features/build/components/MetaResponseDialog.tsx
  - frontend/src/features/build/hooks/useRecommend.ts（POST /recommend 呼び出し）
  - frontend/src/features/build/hooks/useMetaResponse.ts（POST /meta-response 呼び出し）
  - frontend/src/features/build/api/build-api.ts（apiClient ラッパー: postRecommend, postMetaResponse）

- [ ] Step 13: App.tsx ルーティング差し替え
  - frontend/src/App.tsx 更新: `/` → PlanPage、`/build` → BuildPage に PlaceholderPage から差し替え

- [ ] Step 14: i18n namespace 追加（plan, build）
  - frontend/src/i18n/locales/ja/plan.json
  - frontend/src/i18n/locales/en/plan.json
  - frontend/src/i18n/locales/ja/build.json
  - frontend/src/i18n/locales/en/build.json

- [ ] Step 15: フロントエンドユニットテスト
  - frontend/tests/contexts/PlanContext.test.tsx
  - frontend/tests/features/plan/PlanPage.test.tsx
  - frontend/tests/features/plan/DishCard.test.tsx
  - frontend/tests/features/plan/DeployAdviceDisplay.test.tsx
  - frontend/tests/features/build/BuildPage.test.tsx
  - frontend/tests/features/build/RecommendationCard.test.tsx
  - frontend/tests/features/build/MetaResponseDialog.test.tsx

- [ ] Step 16: フロントエンド PBT
  - frontend/tests/pbt/amount-clamp.pbt.ts（Invariant: 適量は 30〜300ml 範囲。BR-11-02）
  - frontend/tests/pbt/disclosure-recommendation-fields.pbt.ts（Invariant: disclosureLevel → 表示フィールドの整合性）

- [ ] Step 17: フロントエンドコードサマリー
  - aidlc-docs/construction/unit2-ai-core/code/frontend-summary.md

### Phase D: インフラ + デプロイ

- [ ] Step 18: Terraform 追加（既存モジュール拡張）
  - infra/modules/lambda-base/ai-role.tf（sdlc-ai-role + sdlc-prompt-seeder-role）
  - infra/modules/lambda-base/prompt-seed.tf（Custom Resource）
  - infra/modules/api-gateway/ai-endpoints.tf（3エンドポイント追加）
  - infra/modules/monitoring/ai-alarms.tf（5アラーム追加）
  - infra/environments/dev/main.tf 更新（prompt_templates, prompt_template_version 変数）
  - infra/environments/prod/main.tf 更新（同上）
  - ⚠️ esbuild.config.mjs（実ファイル名。Unit 1 計画では esbuild.config.ts と記載されているが、実装は .mjs）: handlers/ai/ 配下は自動 glob で検出（Unit 1 で構築済みの自動検出ロジックがそのまま適用）

- [ ] Step 19: デプロイスクリプト更新 + ドキュメント
  - scripts/deploy-backend.sh 更新（Unit 2 Lambda 4本追加）
  - backend/README.md 更新（Unit 2 API エンドポイント追加）

---

## 料理カテゴリ enum（M1 統一決定）

全ドキュメント・コードで以下の正規集合を使用:

```typescript
// packages/shared-types/src/types/dish-category.ts
export const DISH_CATEGORIES = ['sashimi', 'grilled_fish', 'simmered', 'fried', 'meat', 'vegetable', 'nabe', 'dessert'] as const;
export type DishCategory = typeof DISH_CATEGORIES[number];
export type DishCategoryWithOther = DishCategory | 'other';
```

- 8カテゴリ（nabe 含む）+ フォールバック値 `other`
- BR-15-02、domain-entities.md DishInput.category、nfr-design-patterns.md §2.1 DISH_CATEGORIES を統一

---

## ストーリートレーサビリティ

| ストーリー | 実装ステップ | 状態 |
|---|---|---|
| US-04 | Step 1, 11 | [ ] |
| US-06 | Step 1, 11 | [ ] |
| US-08 | Step 1-4, 8-9, 12 | [ ] |
| US-09 | Step 1-3, 5, 8-9, 11-12 | [ ] |
| US-10 | Step 1, 3, 5, 11 | [ ] |
| US-11 | Step 1, 4, 12 | [ ] |
| US-16 | Step 1, 3, 6, 8, 12 | [ ] |

---

## 補足

- **Part 1 / Part 2 の区分**: 本計画は全ステップを1ドキュメントに含む完結形。Part 2（実装）は承認後に本計画のチェックボックスを順次消化する形で実行
- **esbuild エントリ検出**: Unit 1 で構築した `esbuild.config.mjs` は `src/handlers/` 配下の `.ts` ファイルを自動 glob するため、Unit 2 の `handlers/ai/*.ts` は追加設定なしで検出される
