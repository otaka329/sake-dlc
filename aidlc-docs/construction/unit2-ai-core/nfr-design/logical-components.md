# Unit 2: AI Core — 論理コンポーネント

---

## 1. AIGateway 内部モジュール構成

### 1.1 モジュール分解

| モジュール | 責務 | ファイルパス |
|---|---|---|
| TemplateManager | DynamoDB からテンプレート取得（最新バージョン）、変数置換、未置換検証 | backend/src/lib/ai-gateway/template-manager.ts |
| BedrockInvoker | Bedrock InvokeModel（Tool Use）呼び出し、タイムアウト管理 | backend/src/lib/ai-gateway/bedrock-invoker.ts |
| ResponseParser | Tool Use 出力の Zod バリデーション、リトライ判定 | backend/src/lib/ai-gateway/response-parser.ts |
| CacheManager | キャッシュキー生成、DynamoDB キャッシュ読み書き | backend/src/lib/ai-gateway/cache-manager.ts |
| CostController | 推薦回数制限チェック、コスト計装メトリクス送出 | backend/src/lib/ai-gateway/cost-controller.ts |
| AIGateway | 上記モジュールを統合するファサード（BL-15 の実装） | backend/src/lib/ai-gateway/index.ts |

### 1.2 AIGateway ファサード設計

```typescript
// backend/src/lib/ai-gateway/index.ts

export class AIGateway {
  constructor(
    private templateManager: TemplateManager,
    private bedrockInvoker: BedrockInvoker,
    private responseParser: ResponseParser,
    private cacheManager: CacheManager,
    private costController: CostController,
  ) {}

  async invoke(request: AIGatewayRequest): Promise<AIGatewayResponse> {
    // 1. テンプレート取得
    // 2. 変数置換
    // 3. ドライランチェック（DRY_RUN=true → プロンプト返却）
    // 4. Bedrock Tool Use 呼び出し
    // 5. レスポンスパース + リトライ
    // 6. コスト計装
    // 7. レスポンス返却
  }
}
```

### 1.3 ドライランモード

```typescript
// 環境変数 AI_GATEWAY_DRY_RUN=true の場合
if (process.env.AI_GATEWAY_DRY_RUN === 'true') {
  return {
    output: JSON.stringify({
      _dryRun: true,
      prompt: resolvedPrompt,
      toolSchema: toolUseSchema,
      template: { id: template.templateId, version: template.version },
    }),
    inputTokens: 0,
    outputTokens: 0,
    modelId: template.modelId,
    latencyMs: 0,
  };
}
```

---

## 2. サービス層構造

### 2.1 RecommendationService

| メソッド | 責務 |
|---|---|
| `recommend(planInput, userId)` | BL-11 の実装。キャッシュ判定 → AI 推薦 → レスポンス構築 |
| `generateCacheKey(input)` | キャッシュキー生成（SHA-256 先頭16文字） |

**依存**: AIGateway, CacheManager, CostController, DynamoDB (Users, TasteProfiles)

### 2.2 DontDeployService

| メソッド | 責務 |
|---|---|
| `judge(planInput, userId)` | BL-12 の実装。ルールベース判定 → AI 判定 → 代替提案 |
| `checkRules(planInput)` | Phase 1 ルールベース判定（BR-09-01〜04） |
| `generateAlternatives(season, mood, locale)` | BL-13 の実装。ノンアル代替提案生成 |

**依存**: AIGateway, DynamoDB (Users)

### 2.3 MetaResponseService

| メソッド | 責務 |
|---|---|
| `respond(message, userId)` | BL-14 の実装。判断委任パターン検出 → AI メタ応答 |
| `isMetaQuestion(message)` | 判断委任パターンマッチング |

**依存**: AIGateway

---

## 3. フロントエンド連携

### 3.1 API 呼び出しフロー

```
PlanPage（カード式入力）
     |
     | カード入力変更イベント（デバウンス 1秒）
     v
POST /dont-deploy（自動呼び出し）
     |
     | DeployAdvice レスポンス
     v
DeployAdviceDisplay（画面下部に表示）
     |
     | ユーザーが「推薦を受ける」タップ
     v
POST /recommend
     |
     | RecommendationResponse レスポンス
     v
BuildPage → RecommendationList（Layer 別表示）
```

### 3.2 ローディング・エラー状態

| 状態 | 表示 |
|---|---|
| 推薦ローディング | スケルトンカード（3件分） + 「推薦中...」メッセージ |
| 推薦エラー | エラーメッセージ + リトライボタン |
| 回数制限超過 | 「本日の推薦回数上限（3回）に達しました」+ 翌日リセット案内 |
| キャッシュヒット | 通常表示（ユーザーには区別不可） |

---

## 4. インフラ論理構成

### 4.1 Lambda IAM ロール（Unit 2 追加分）

| ロール | 権限 | 対象 Lambda |
|---|---|---|
| sdlc-ai-role | bedrock:InvokeModel (Sonnet/Haiku), DynamoDB: GetItem/PutItem/UpdateItem (AppData, Users, TasteProfiles), CloudWatch: PutMetricData | post-recommend, post-dont-deploy, post-meta-response |

### 4.2 Lambda 環境変数（Unit 2 追加分）

| 変数 | 値 | 用途 |
|---|---|---|
| BEDROCK_REGION | ap-northeast-1 | Bedrock エンドポイントリージョン |
| AI_GATEWAY_DRY_RUN | false (prod), true (テスト時) | ドライランモード |
| RECOMMEND_DAILY_LIMIT | 3 | 推薦回数制限 |
| RECOMMEND_CACHE_TTL_SECONDS | 3600 | キャッシュ TTL（1時間） |

### 4.3 Terraform Custom Resource（プロンプトシード）

```hcl
# infra/modules/ai-core/prompt-seed.tf

resource "aws_lambda_function" "prompt_seeder" {
  function_name = "sdlc-prompt-seeder-${var.env}"
  handler       = "seed-prompts.handler"
  runtime       = "nodejs22.x"
  # ...
}

resource "aws_cloudformation_stack" "prompt_seed" {
  name = "sdlc-prompt-seed-${var.env}"

  template_body = jsonencode({
    Resources = {
      PromptSeed = {
        Type = "Custom::PromptSeed"
        Properties = {
          ServiceToken = aws_lambda_function.prompt_seeder.arn
          Templates    = var.prompt_templates  # Terraform 変数で定義
          Version      = var.prompt_version    # 変更で Update 発火
        }
      }
    }
  })
}
```

**ライフサイクル**:
- Create: 初回 apply でテンプレートを DynamoDB に投入
- Update: `prompt_version` 変更で Lambda が再実行、新バージョンを追加（旧バージョンは残存）
- Delete: テンプレートは削除しない（Custom Resource の Delete は no-op）

### 4.4 Bedrock サービスクォータ設定

| 設定 | 値 | 根拠 |
|---|---|---|
| Sonnet リクエスト/分 | 50（デフォルト） | MAU 500 で十分 |
| Haiku リクエスト/分 | 100（デフォルト） | 十分 |
| サービスクォータ変更申請 | 不要（初期） | ピーク 5 req/min で余裕 |

---

## 5. 設計変更注記

### BL-17（matchScore 算出）の廃止 + flavorScores ハイブリッド方式

NFR Design Q3=B の決定により、matchScore は AI（Bedrock Tool Use）が算出する設計に変更。
flavorScores は Lambda が SakenowaCache から付与（ハルシネーション防止）。

| 項目 | 旧設計（Functional Design） | 新設計（NFR Design） |
|---|---|---|
| matchScore 算出場所 | Lambda（BL-17 ユークリッド距離） | AI（Tool Use 出力に含む） |
| matchScore ロジック | 数学的（ユークリッド距離 / sqrt(6)） | AI 推論（フレーバー類似度 + 料理相性を総合判断） |
| matchScore 精度 | 決定的（同一入力 → 同一結果） | 確率的（AI の推論に依存。[0,1] 範囲は Tool Use スキーマ + Zod で強制） |
| flavorScores | AI 出力（ハルシネーションリスク） | **Lambda が SakenowaCache から付与**（正確性保証） |
| メリット | — | 料理相性を含む「人間的な」適合度 + flavorScores の正確性を両立 |

**上流ドキュメントへの反映状況**:
- ✅ `business-logic-model.md` BL-17: 「NFR Design で改訂」注記追加
- ✅ `business-logic-model.md` BL-11 Step 8-9: flavorScores Lambda 付与 + matchScore AI 算出に書き換え
- ✅ `business-rules.md` BR-08-04: 検証条件を「AI 出力 [0,1] + flavorScores は SakenowaCache から」に更新
- ✅ `nfr-requirements.md` PBT 表: Commutativity を N/A に変更、Invariant のみ残存
