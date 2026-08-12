# Unit 2: AI Core — インフラ設計

---

## 1. Bedrock 接続設定

| 設定項目 | 値 | 根拠 |
|---|---|---|
| リージョン | ap-northeast-1（東京） | レイテンシ最小。アプリ全体と同一リージョン |
| モデル（推薦） | anthropic.claude-3-5-sonnet-20241022-v2:0 | 高品質推薦文生成 |
| モデル（判定/メタ応答） | anthropic.claude-3-haiku-20240307-v1:0 | 低コスト・高速 |
| 認証 | Lambda IAM ロール（bedrock:InvokeModel） | SECURITY-06 最小権限 |

### 1.1 推論プロファイルの要否（⚠️ デプロイ前に要確認）

東京リージョン（ap-northeast-1）では、モデルによってオンデマンド直接呼び出しの可否が異なる:

| モデル | 東京オンデマンド | クロスリージョン推論プロファイル | 確認ステータス |
|---|---|---|---|
| Claude 3 Haiku | ✅ 利用可（実績あり） | 不要 | 確認済み |
| Claude 3.5 Sonnet v2 | ⚠️ **デプロイ前にアカウントで実確認が必要** | 必要な場合あり（`apac.anthropic.claude-3-5-sonnet-20241022-v2:0`） | 未確認 |

**推論プロファイルが必要な場合の影響**:

1. **modelId の変更**: テンプレート定義（§5 tfvars）を `apac.anthropic.claude-3-5-sonnet-20241022-v2:0` に更新
2. **IAM リソース ARN の変更**: 推論プロファイル ARN + プロファイルがルーティングする各リージョンの foundation-model ARN を含める
3. **データ所在**: APAC プロファイルは東京以外の APAC リージョン（大阪・シドニー・ムンバイ等）へルーティングし得る。プロンプトに PII を含まない設計（Q5=A で userId 非送信）のため許容可能だが、データ所在ポリシーとして明記
4. **クォータ**: プロファイル単位の req/min・TPM 制限を確認

**デプロイ前チェックリスト**:
- [ ] AWS コンソール → Bedrock → Model access で Sonnet v2 の東京リージョン利用可否を確認
- [ ] 利用不可の場合: 推論プロファイル（apac.*）で試行し、レイテンシを計測
- [ ] 確認結果に応じて terraform.tfvars の modelId と IAM ポリシーを確定
- [ ] プロファイル利用時はデータ所在注記を deployment-architecture.md に追記

**IAM ポリシー（確定後に以下のいずれかを適用）**:

(a) オンデマンド直接呼び出し可能な場合:
```
Resource: [
  "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
  "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
]
```

(b) 推論プロファイル必要な場合:
```
Resource: [
  "arn:aws:bedrock:ap-northeast-1:{account}:inference-profile/apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
  "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
]
```

⚠️ M3 対応: ワイルドカード `anthropic.claude-*` は不使用。利用する2モデルID（またはプロファイルARN）に限定し、Opus 等の高単価モデルの意図しない呼び出しを防止（Defense-in-depth コスト統制）。

---

## 2. Lambda 関数（Unit 2 追加分）

### 関数一覧

| 関数名 | ソースパス | メモリ | タイムアウト | IAM ロール | トリガー |
|---|---|---|---|---|---|
| post-recommend | backend/src/handlers/ai/recommend.ts | 512MB | 20秒 | sdlc-ai-role | API Gateway |
| post-dont-deploy | backend/src/handlers/ai/dont-deploy.ts | 512MB | 10秒 | sdlc-ai-role | API Gateway |
| post-meta-response | backend/src/handlers/ai/meta-response.ts | 512MB | 10秒 | sdlc-ai-role | API Gateway |
| prompt-seeder | backend/src/handlers/ai/seed-prompts.ts | 256MB | 60秒 | sdlc-prompt-seeder-role | CloudFormation Custom Resource |

> **表記規則**: 「ソースパス」列は開発者向け（コード所在地）。Terraform / Lambda 設定の `handler` 値は esbuild バンドル後の `index.handler`（全 Lambda 共通）。Unit 1 の関数一覧表も同じ規則。

### メモリ 512MB の根拠
- AI レスポンス（Tool Use JSON）のパース + Zod バリデーション
- SakenowaCache データ（上位30銘柄のフレーバーデータ）の読み込み・処理
- キャッシュキー正規化（料理カテゴリ推定、mood バケット化）
- 256MB でも動作するが、コールドスタート時のメモリ圧迫を回避

---

## 3. IAM ロール（既存 lambda-base モジュールに追加）

### sdlc-ai-role

```hcl
resource "aws_iam_role" "ai_role" {
  name = "sdlc-ai-role-${var.env}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}
```

| 権限 | リソース | 用途 |
|---|---|---|
| bedrock:InvokeModel | ※H2で確定するモデル/プロファイルARNに限定（下記§1.1参照） | Bedrock Claude 呼び出し |
| dynamodb:GetItem | AppData テーブル ARN | キャッシュ読み込み、推薦回数カウンター取得 |
| dynamodb:Query | AppData テーブル ARN | テンプレート最新バージョン取得（BL-16: begins_with + 降順 + Limit 1） |
| dynamodb:PutItem | AppData テーブル ARN | キャッシュ書き込み |
| dynamodb:UpdateItem | AppData テーブル ARN | 推薦回数カウンター原子的増分 |
| dynamodb:GetItem | Users テーブル ARN | disclosureLevel 取得 |
| dynamodb:GetItem | TasteProfiles テーブル ARN | TasteProfile 取得 |
| dynamodb:GetItem | SakenowaCache テーブル ARN | フレーバーデータ取得（flavorScores Lambda付与用）。⚠️ 書き込み（キャッシュ投入）は Unit 3 BE-09 SakenowaSync が担当。Unit 2 は読み取りのみ |
| logs:* | ロググループ ARN | CloudWatch Logs |
| xray:PutTraceSegments, xray:PutTelemetryRecords | * | X-Ray トレーシング |
| cloudwatch:PutMetricData | * | カスタムメトリクス |

### sdlc-prompt-seeder-role

| 権限 | リソース | 用途 |
|---|---|---|
| dynamodb:PutItem | AppData テーブル ARN（Condition: `dynamodb:LeadingKeys` = ["SYSTEM"]） | テンプレートシード投入 |
| dynamodb:Query | AppData テーブル ARN（Condition: `dynamodb:LeadingKeys` = ["SYSTEM"]） | 既存バージョン確認 |
| logs:* | ロググループ ARN | CloudWatch Logs |

**IAM Condition 実装例**:
```json
{
  "Condition": {
    "ForAllValues:StringEquals": {
      "dynamodb:LeadingKeys": ["SYSTEM"]
    }
  }
}
```

---

## 4. API Gateway エンドポイント追加（既存 api-gateway モジュールに追加）

| メソッド | パス | Lambda | 認証 |
|---|---|---|---|
| POST | /recommend | post-recommend | Cognito |
| POST | /dont-deploy | post-dont-deploy | Cognito |
| POST | /meta-response | post-meta-response | Cognito |

---

## 5. Terraform Custom Resource（プロンプトシード）

### 構成

```hcl
# infra/modules/lambda-base/prompt-seed.tf（既存モジュールに集約。Q3=A）
# ⚠️ NFR Design logical-components.md §4.3 に「infra/modules/ai-core/」と記載があるが、
# Infrastructure Design（Q3=A）の決定で lambda-base に集約。NFR Design 側は参照パスが旧い。

resource "aws_lambda_function" "prompt_seeder" {
  function_name = "sdlc-prompt-seeder-${var.env}"
  handler       = "index.handler"  # esbuild バンドル後のエントリポイント
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 60
  role          = aws_iam_role.prompt_seeder_role.arn

  environment {
    variables = {
      APP_DATA_TABLE = var.app_data_table_name
    }
  }
}

resource "aws_cloudformation_stack" "prompt_seed" {
  name = "sdlc-prompt-seed-${var.env}"

  template_body = jsonencode({
    Resources = {
      PromptSeed = {
        Type = "Custom::PromptSeed"
        Properties = {
          ServiceToken = aws_lambda_function.prompt_seeder.arn
          Version      = var.prompt_template_version
          Templates = jsonencode(var.prompt_templates)
        }
      }
    }
  })
}
```

### テンプレート定義（terraform.tfvars）

```hcl
prompt_template_version = "1"

prompt_templates = [
  {
    templateId  = "recommend"
    modelId     = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    maxTokens   = 2000
    temperature = 0.7
    variables   = ["dishes", "mood", "tasteProfile", "flavorData", "disclosureLevel", "locale"]
  },
  {
    templateId  = "dont-deploy"
    modelId     = "anthropic.claude-3-haiku-20240307-v1:0"
    maxTokens   = 500
    temperature = 0.3
    variables   = ["conditionScore", "sleepHours", "tomorrowSchedule", "mood"]
  },
  {
    templateId  = "alternative-proposal"
    modelId     = "anthropic.claude-3-haiku-20240307-v1:0"
    maxTokens   = 500
    temperature = 0.7
    variables   = ["season", "mood", "locale"]
  },
  {
    templateId  = "meta-response"
    modelId     = "anthropic.claude-3-haiku-20240307-v1:0"
    maxTokens   = 300
    temperature = 0.5
    variables   = ["userMessage", "locale"]
  }
]
```

### ライフサイクル
- **Create**: 初回 apply でテンプレートを DynamoDB に投入（version = `var.prompt_template_version`）
- **Update**: `prompt_template_version` 変更で CFn Update 発火 → seeder Lambda が指定バージョンで投入
- **Delete**: no-op（テンプレートは削除しない）

**バージョン採番ソース**: Terraform の `var.prompt_template_version` が唯一の正（Single Source of Truth）。seeder Lambda は渡された Version をそのまま DynamoDB の SK（`PROMPT#{id}#v{version}`）に使用する。Lambda 側で max+1 等の自動採番はしない。`Templates` のみ変更して `Version` を据え置いた場合は、同一バージョンが上書きされる（冪等）。新バージョンを作る場合は必ず `prompt_template_version` をインクリメントすること。

---

## 6. Lambda 環境変数

| 変数 | 値 | 対象 Lambda |
|---|---|---|
| BEDROCK_REGION | ap-northeast-1 | post-recommend, post-dont-deploy, post-meta-response |
| AI_GATEWAY_DRY_RUN | false（prod）/ 環境変数で制御 | 同上 |
| RECOMMEND_DAILY_LIMIT | 3 | post-recommend |
| RECOMMEND_CACHE_TTL_SECONDS | 3600 | post-recommend |
| APP_DATA_TABLE | sdlc-app-data-{env} | 全 Unit 2 Lambda |
| USERS_TABLE | sdlc-users-{env} | 同上 |
| TASTE_PROFILES_TABLE | sdlc-taste-profiles-{env} | post-recommend |
| SAKENOWA_CACHE_TABLE | sdlc-sakenowa-cache-{env} | post-recommend |
| ALLOWED_ORIGIN | https://{cloudfront}.cloudfront.net | 同上 |
| LOG_LEVEL | DEBUG（dev）/ INFO（prod） | 同上 |
| POWERTOOLS_SERVICE_NAME | 各関数名 | 同上 |

---

## 7. 監視（Unit 2 追加アラーム）

| アラーム名 | メトリクス | 条件 | アクション |
|---|---|---|---|
| sdlc-ai-latency-{env} | SDLC/AIGateway LatencyMs | p95 > 5000ms（5分間） | SNS |
| sdlc-ai-error-rate-{env} | SDLC/AIGateway ErrorCount / InvocationCount | > 10%（5分間） | SNS |
| sdlc-ai-cost-warning-{env} | SDLC/AIGateway EstimatedMonthlyCost | > $40 | SNS |
| sdlc-ai-parse-failure-{env} | SDLC/AIGateway ParseFailureCount | > 20%（5分間） | SNS |
| sdlc-ai-cache-hit-low-{env} | SDLC/AIGateway CacheHitRate | < 20%（1時間） | SNS |

---

## 8. CloudWatch ロググループ

| ロググループ | 保持期間 | 対象 Lambda |
|---|---|---|
| /aws/lambda/sdlc-post-recommend-{env} | dev:30日, prod:180日 | post-recommend |
| /aws/lambda/sdlc-post-dont-deploy-{env} | 同上 | post-dont-deploy |
| /aws/lambda/sdlc-post-meta-response-{env} | 同上 | post-meta-response |
| /aws/lambda/sdlc-prompt-seeder-{env} | 30日（両環境） | prompt-seeder |
