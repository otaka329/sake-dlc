# Unit 1: Foundation — インフラ設計

---

## 1. Cognito モジュール

### 1.1 User Pool

| 設定項目 | 値 | 根拠 |
|---|---|---|
| ユーザー名属性 | email | メールアドレスでログイン |
| 自動検証属性 | email | メール確認フロー |
| MFA 設定 | OPTIONAL | BR-02B: ユーザー任意で TOTP 有効化 |
| パスワードポリシー | MinimumLength=15, RequireUppercase=false, RequireLowercase=false, RequireNumbers=false, RequireSymbols=false | NIST SP 800-63B §3.1.1: 文字種混合ルール禁止 |
| Advanced Security | ENFORCED | Adaptive Authentication 有効。リスクベース認証 |
| アカウント復旧 | email のみ | SMS 非使用（NIST 推奨） |
| Lambda Trigger | Pre Sign-up: cognito-pre-signup-trigger | ブロックリスト照合（BL-08） |

### 1.2 App Client

| 設定項目 | 値 |
|---|---|
| 認証フロー | ALLOW_USER_SRP_AUTH, ALLOW_REFRESH_TOKEN_AUTH |
| OAuth フロー | Authorization Code Grant（ソーシャルログイン用） |
| コールバック URL | dev: https://{cloudfront-dev}.cloudfront.net/callback, prod: 同様 |
| ログアウト URL | dev: https://{cloudfront-dev}.cloudfront.net/login, prod: 同様 |
| トークン有効期限 | Access: 1h, ID: 1h, Refresh: 30d |
| シークレット生成 | なし（SPA のため） |

### 1.3 Identity Provider

| プロバイダー | 設定 |
|---|---|
| Google | OAuth 2.0 Client ID/Secret（SSM Parameter Store） |
| Apple | Service ID, Team ID, Key ID, Private Key（SSM Parameter Store） |

### Terraform リソース

```hcl
# modules/cognito/main.tf
resource "aws_cognito_user_pool" "main" { ... }
resource "aws_cognito_user_pool_client" "spa" { ... }
resource "aws_cognito_identity_provider" "google" { ... }
resource "aws_cognito_identity_provider" "apple" { ... }
resource "aws_cognito_user_pool_domain" "main" { ... }  # Cognito ホスティングドメイン
```

---

## 2. API Gateway モジュール

### 2.1 REST API

| 設定項目 | 値 | 根拠 |
|---|---|---|
| API タイプ | REST API | Lambda プロキシ統合 |
| Authorizer | Cognito User Pool Authorizer | SECURITY-08 |
| ステージ | dev, prod | ディレクトリ分離に対応 |
| アクセスログ | 有効（CloudWatch Logs） | SECURITY-02 |
| 実行ログ | ERROR レベル（prod）、INFO レベル（dev） | SECURITY-02 |
| X-Ray トレーシング | 有効 | 可観測性 |

### 2.2 スロットリング（2層構成）

| レイヤー | 設定 | 値 |
|---|---|---|
| ステージレベル | throttling_rate_limit | 500 |
| ステージレベル | throttling_burst_limit | 1000 |
| ユーザーレベル | Lambda ミドルウェア内 | 100 req/min（DynamoDB カウンター） |

### 2.3 Gateway Response（7種）

| Response Type | Status | code | Content-Type |
|---|---|---|---|
| UNAUTHORIZED | 401 | AUTH_ERROR | application/json |
| ACCESS_DENIED | 403 | FORBIDDEN | application/json |
| REQUEST_TOO_LARGE | 413 | VALIDATION_ERROR | application/json |
| THROTTLED | 429 | RATE_LIMITED | application/json |
| INTEGRATION_TIMEOUT | 504 | INTERNAL_ERROR | application/json |
| DEFAULT_4XX | 4xx | AUTH_ERROR | application/json |
| DEFAULT_5XX | 5xx | INTERNAL_ERROR | application/json |

全 Gateway Response に CORS ヘッダー（`Access-Control-Allow-Origin: ${stageVariables.allowed_origin}`）を付与。

### 2.4 CORS 設定

各リソースに OPTIONS メソッド（Mock Integration）を定義:
- `Access-Control-Allow-Origin`: `${stageVariables.allowed_origin}`
- `Access-Control-Allow-Methods`: `GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type,Authorization`
- `Access-Control-Max-Age`: `86400`

### 2.5 エンドポイント一覧（Unit 1 スコープ）

| メソッド | パス | Lambda | 認証 |
|---|---|---|---|
| POST | /signup | signup-handler | Cognito |
| GET | /profile | get-profile | Cognito |
| PUT | /profile | put-profile | Cognito |
| POST | /mfa/setup | post-mfa-setup | Cognito |
| POST | /mfa/verify | post-mfa-verify | Cognito |
| DELETE | /mfa | delete-mfa | Cognito |
| POST | /mfa/recovery-codes | post-recovery-codes | Cognito |
| PUT | /disclosure-level | put-disclosure-level | Cognito |

### Terraform リソース

```hcl
# modules/api-gateway/main.tf
resource "aws_api_gateway_rest_api" "main" { ... }
resource "aws_api_gateway_authorizer" "cognito" { ... }
resource "aws_api_gateway_stage" "main" { ... }
resource "aws_api_gateway_method_settings" "all" { ... }  # スロットリング
resource "aws_api_gateway_gateway_response" "unauthorized" { ... }
# ... 他6種の Gateway Response
resource "aws_api_gateway_deployment" "main" { ... }
```

---

## 3. DynamoDB モジュール

### 5テーブル構成（NFR Design ハイブリッド設計）

#### Users テーブル

| 設定項目 | 値 |
|---|---|
| PK | userId (S) |
| SK | entityType (S) |
| GSI1 | email-index: PK=email, SK=userId |
| キャパシティ | オンデマンド |
| 暗号化 | AWS managed key (aws/dynamodb) |
| PITR | 有効（35日間） |
| TTL | なし |

#### TasteProfiles テーブル

| 設定項目 | 値 |
|---|---|
| PK | userId (S) |
| SK | なし |
| キャパシティ | オンデマンド |
| 暗号化 | AWS managed key |
| PITR | 有効（35日間） |
| TTL | なし |

#### DrinkingLogs テーブル

| 設定項目 | 値 |
|---|---|
| PK | userId (S) |
| SK | logId (S) — `LOG#{ISO8601}` |
| GSI1 | sake-index: PK=sakeId, SK=timestamp |
| キャパシティ | オンデマンド |
| 暗号化 | AWS managed key |
| PITR | 有効（35日間） |
| TTL | なし |

#### SakenowaCache テーブル

| 設定項目 | 値 |
|---|---|
| PK | dataType (S) |
| SK | なし |
| キャパシティ | オンデマンド |
| 暗号化 | AWS managed key |
| PITR | 無効（キャッシュデータのため復元不要） |
| TTL | 有効（ttl 属性、24h 自動期限切れ） |

#### AppData テーブル

| 設定項目 | 値 |
|---|---|
| PK | userId (S) |
| SK | dataType (S) |
| キャパシティ | オンデマンド |
| 暗号化 | AWS managed key |
| PITR | 有効（35日間） |
| TTL | 有効（RATELIMIT エントリの自動削除） |

### Terraform リソース

```hcl
# modules/dynamodb/main.tf
resource "aws_dynamodb_table" "users" { ... }
resource "aws_dynamodb_table" "taste_profiles" { ... }
resource "aws_dynamodb_table" "drinking_logs" { ... }
resource "aws_dynamodb_table" "sakenowa_cache" { ... }
resource "aws_dynamodb_table" "app_data" { ... }
```

---

## 4. S3 + CloudFront モジュール

### 4.1 S3 バケット（SPA ホスティング）

| 設定項目 | 値 | 根拠 |
|---|---|---|
| バケット名 | sdlc-frontend-{env} | 環境別 |
| パブリックアクセス | 全ブロック | SECURITY-09 |
| 暗号化 | SSE-S3 (AES-256) | SECURITY-01 |
| バージョニング | 有効 | RPO 即時 |
| CORS | 不要（CloudFront OAC 経由のみ） | — |

### 4.2 CloudFront Distribution

| 設定項目 | 値 | 根拠 |
|---|---|---|
| オリジン（SPA） | S3 バケット（OAC） | — |
| オリジン（API） | API Gateway ステージ URL | — |
| ビヘイビア /api/* | API Gateway オリジン、キャッシュ無効 | API はキャッシュしない |
| ビヘイビア /* | S3 オリジン、CachingOptimized | 静的アセットキャッシュ |
| デフォルトルートオブジェクト | index.html | SPA |
| カスタムエラーレスポンス | 403/404 → /index.html (200) | SPA ルーティング |
| Response Headers Policy | sdlc-security-headers | SECURITY-04 |
| TLS | TLSv1.2_2021 | SECURITY-01 |
| ログ | 標準ログ有効（S3 バケット） | SECURITY-02 |

### CloudFront ログバケット

| 設定項目 | 値 | 根拠 |
|---|---|---|
| バケット名 | sdlc-logs-{env} | CloudFront 標準ログ + Cognito バックアップ |
| パブリックアクセス | 全ブロック | SECURITY-09 |
| 暗号化 | SSE-S3 (AES-256) | SECURITY-01 |
| バージョニング | 無効（ログは追記のみ） | — |

### S3 ライフサイクルポリシー（コスト最適化）

| 経過日数 | ストレージクラス | 概算コスト（GB/月） | 根拠 |
|---|---|---|---|
| 0〜30日 | S3 Standard | $0.025 | 直近ログは即時アクセス可能に |
| 31〜90日 | S3 Standard-IA | $0.0138 | アクセス頻度低下。インシデント調査時のみ参照 |
| 91〜180日 | S3 Glacier Instant Retrieval | $0.005 | SECURITY-14 保持要件（prod 180日）を低コストで充足。ミリ秒単位の取得可能 |
| 181日〜 | 削除（prod）/ 31日〜削除（dev） | — | 保持期間超過分を自動削除 |

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }

    expiration {
      days = var.log_retention_days  # dev: 30, prod: 180
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}
```

⚠️ dev 環境では expiration 30日のため、Standard-IA / Glacier への遷移は発生しない（削除が先）。ライフサイクルルールは共通定義で問題なし。
| ドメイン | 初期: {id}.cloudfront.net。カスタムドメインは後日追加 | Q3 回答 |

### 4.3 Response Headers Policy

```hcl
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "sdlc-security-headers-${var.env}"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    content_type_options { override = true }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "Content-Security-Policy"
      value    = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.amazonaws.com https://*.auth.*.amazoncognito.com"
      override = true
    }
  }
}
```

⚠️ CSP `style-src 'unsafe-inline'` は Code Generation ステージで CSS フレームワーク確定後に nonce 化を検討。

---

## 5. Lambda 基盤モジュール

### 5.1 共通 Lambda Layer

| レイヤー | 内容 | サイズ概算 |
|---|---|---|
| sdlc-common-layer | @aws-lambda-powertools/logger, tracer, metrics, Zod, pino | ~5MB |

### 5.2 IAM ロール（最小権限）

| ロール | 権限 | 対象 Lambda |
|---|---|---|
| sdlc-auth-role | Users: PutItem/GetItem/UpdateItem, TasteProfiles: PutItem, AppData: UpdateItem(RATELIMIT), CloudWatch Logs, X-Ray | signup-handler, get-profile, put-profile, put-disclosure-level |
| sdlc-mfa-role | Users: UpdateItem, KMS: Encrypt, CloudWatch Logs, X-Ray | post-mfa-setup, post-mfa-verify, delete-mfa, post-recovery-codes |
| sdlc-presignup-role | Secrets Manager: GetSecretValue, CloudWatch Logs | cognito-pre-signup-trigger |
| sdlc-backup-role | Cognito: ListUsers/AdminGetUser, S3: PutObject, CloudWatch Logs | cognito-daily-backup |

### 5.3 Lambda 共通設定

| 設定項目 | 値 | 根拠 |
|---|---|---|
| ランタイム | nodejs22.x | Node.js 22 LTS |
| メモリ | 256MB（デフォルト） | コスト最適化。必要に応じて調整 |
| タイムアウト | 30秒（デフォルト）、Pre Sign-up: 5秒 | Pre Sign-up は HaveIBeenPwned API タイムアウト 2秒 + 余裕 |
| SnapStart | N/A（Node.js 未対応。Java/Python のみ） | コールドスタート対策は esbuild tree-shaking + Lambda Layer + Powertools 遅延 import で対応。Provisioned Concurrency は MAU 100-500 では不採用（NFR Requirements で決定済み） |
| 環境変数 | USERS_TABLE, TASTE_PROFILES_TABLE, APP_DATA_TABLE, ALLOWED_ORIGIN, LOG_LEVEL, POWERTOOLS_SERVICE_NAME | — |
| DLQ | SQS（非同期 Lambda のみ） | SECURITY-15 |
| ロググループ保持 | dev: 30日、prod: 180日 | SECURITY-14（≥90日）は prod 要件。dev は開発効率のため 30日に緩和 |

### 5.4 Lambda 関数一覧（Unit 1 スコープ）

| 関数名 | ハンドラーパス | IAM ロール | トリガー |
|---|---|---|---|
| signup-handler | backend/src/handlers/auth/signup.handler | sdlc-auth-role | API Gateway |
| get-profile | backend/src/handlers/auth/get-profile.handler | sdlc-auth-role | API Gateway |
| put-profile | backend/src/handlers/auth/put-profile.handler | sdlc-auth-role | API Gateway |
| put-disclosure-level | backend/src/handlers/auth/put-disclosure-level.handler | sdlc-auth-role | API Gateway |
| post-mfa-setup | backend/src/handlers/auth/mfa-setup.handler | sdlc-mfa-role | API Gateway |
| post-mfa-verify | backend/src/handlers/auth/mfa-verify.handler | sdlc-mfa-role | API Gateway |
| delete-mfa | backend/src/handlers/auth/delete-mfa.handler | sdlc-mfa-role | API Gateway |
| post-recovery-codes | backend/src/handlers/auth/recovery-codes.handler | sdlc-mfa-role | API Gateway |
| cognito-pre-signup-trigger | backend/src/handlers/auth/pre-signup.handler | sdlc-presignup-role | Cognito Trigger |
| cognito-daily-backup | backend/src/handlers/auth/daily-backup.handler | sdlc-backup-role | EventBridge Schedule |

### Terraform リソース

```hcl
# modules/lambda-base/main.tf
resource "aws_lambda_layer_version" "common" { ... }
resource "aws_iam_role" "auth_role" { ... }
resource "aws_iam_role" "mfa_role" { ... }
resource "aws_iam_role" "presignup_role" { ... }
resource "aws_iam_role" "backup_role" { ... }
resource "aws_cloudwatch_log_group" "lambda_logs" { ... }  # for_each
```

---

## 6. 監視モジュール

### 6.1 CloudWatch アラーム

| アラーム名 | メトリクス | 条件 | アクション |
|---|---|---|---|
| sdlc-5xx-error | AWS/ApiGateway 5XXError | > 5%（5分間） | SNS |
| sdlc-lambda-error | AWS/Lambda Errors | > 10%（5分間） | SNS |
| sdlc-dynamodb-throttle | AWS/DynamoDB ThrottledRequests | > 0（5分間） | SNS |
| sdlc-dlq-messages | AWS/SQS ApproximateNumberOfMessagesVisible | > 0 | SNS |
| sdlc-hibp-timeout | SDLC/Foundation HibpTimeoutCount | > 5（5分間） | SNS |

### 6.2 SNS トピック

| トピック | サブスクリプション |
|---|---|
| sdlc-alerts-{env} | メール（運用担当者） |

### 6.3 X-Ray

| 設定項目 | 値 |
|---|---|
| API Gateway | トレーシング有効 |
| Lambda | Powertools Tracer（Active tracing） |
| サンプリングレート | dev: 100%, prod: 5% |

### Terraform リソース

```hcl
# modules/monitoring/main.tf
resource "aws_cloudwatch_metric_alarm" "api_5xx" { ... }
resource "aws_cloudwatch_metric_alarm" "lambda_errors" { ... }
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" { ... }
resource "aws_cloudwatch_metric_alarm" "dlq_messages" { ... }
resource "aws_cloudwatch_metric_alarm" "hibp_timeout" { ... }
resource "aws_sns_topic" "alerts" { ... }
resource "aws_sns_topic_subscription" "email" { ... }
```

---

## 7. 環境変数・シークレット管理

### 7.1 SSM Parameter Store

| パラメータ | タイプ | 用途 |
|---|---|---|
| /sdlc/{env}/google-oauth-client-id | String | Google OAuth Client ID |
| /sdlc/{env}/google-oauth-client-secret | SecureString | Google OAuth Client Secret |
| /sdlc/{env}/apple-service-id | String | Apple Service ID |
| /sdlc/{env}/apple-team-id | String | Apple Team ID |
| /sdlc/{env}/apple-key-id | String | Apple Key ID |
| /sdlc/{env}/apple-private-key | SecureString | Apple Private Key |
| /sdlc/{env}/vapid-public-key | String | VAPID 公開鍵（Unit 5） |
| /sdlc/{env}/vapid-private-key | SecureString | VAPID 秘密鍵（Unit 5） |

### 7.2 KMS

| キー | 用途 |
|---|---|
| sdlc-recovery-codes-{env} | MFA リカバリーコードの HMAC-SHA-256 鍵 |

### 7.3 Terraform ステージ変数

| 変数 | dev | prod |
|---|---|---|
| allowed_origin | https://{cloudfront-dev}.cloudfront.net | https://{cloudfront-prod}.cloudfront.net |
| log_level | DEBUG | INFO |

---

## 8. Terraform モジュール構成サマリー

```
infra/
+-- modules/
|   +-- cognito/           # User Pool, App Client, IdP, Advanced Security
|   +-- api-gateway/       # REST API, Authorizer, Gateway Response, CORS
|   +-- dynamodb/          # 5 テーブル, GSI, 暗号化, PITR, TTL
|   +-- s3-cloudfront/     # SPA バケット, Distribution, OAC, Headers Policy, ログバケット + ライフサイクル
|   +-- lambda-base/       # Layer, IAM ロール, ロググループ
|   +-- monitoring/        # CloudWatch アラーム, SNS, X-Ray
+-- environments/
|   +-- dev/
|   |   +-- main.tf        # モジュール呼び出し (dev パラメータ)
|   |   +-- variables.tf
|   |   +-- terraform.tfvars
|   |   +-- backend.tf     # S3 バックエンド (dev)
|   +-- prod/
|       +-- main.tf        # モジュール呼び出し (prod パラメータ)
|       +-- variables.tf
|       +-- terraform.tfvars
|       +-- backend.tf     # S3 バックエンド (prod)
+-- backend-setup/
    +-- main.tf             # S3 バケット + DynamoDB ロックテーブル (bootstrap)
```
