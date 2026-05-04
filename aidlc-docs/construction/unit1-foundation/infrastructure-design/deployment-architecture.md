# Unit 1: Foundation — デプロイアーキテクチャ

---

## 1. 環境構成

### 1.1 環境一覧

| 環境 | 用途 | AWS アカウント | Terraform ディレクトリ |
|---|---|---|---|
| dev | 開発・テスト | 同一アカウント（リソース名で分離） | infra/environments/dev/ |
| prod | 本番 | 同一アカウント（リソース名で分離） | infra/environments/prod/ |

### 1.2 リソース命名規則

```
{project}-{resource}-{env}

例:
  sdlc-users-table-dev
  sdlc-users-table-prod
  sdlc-frontend-dev (S3)
  sdlc-frontend-prod (S3)
  sdlc-auth-signup-handler-dev (Lambda)
```

### 1.3 環境別パラメータ

| パラメータ | dev | prod |
|---|---|---|
| allowed_origin | https://{cf-dev}.cloudfront.net | https://{cf-prod}.cloudfront.net |
| log_level | DEBUG | INFO |
| xray_sampling_rate | 1.0 (100%) | 0.05 (5%) |
| cognito_advanced_security | ENFORCED | ENFORCED |
| api_gateway_throttle_rate | 500 | 500 |
| api_gateway_throttle_burst | 1000 | 1000 |
| cloudwatch_log_retention | 30 | 180 |
| sns_alert_email | dev-alerts@example.com | prod-alerts@example.com |

---

## 2. Terraform バックエンド設定

### 2.1 Bootstrap（初回のみ手動実行）

```hcl
# infra/backend-setup/main.tf
# S3 バケット + DynamoDB ロックテーブルを作成
# terraform init && terraform apply で bootstrap

resource "aws_s3_bucket" "terraform_state" {
  bucket = "sdlc-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "sdlc-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 2.2 環境別バックエンド

```hcl
# infra/environments/dev/backend.tf
terraform {
  backend "s3" {
    bucket         = "sdlc-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "sdlc-terraform-locks"
    encrypt        = true
  }
}

# infra/environments/prod/backend.tf
terraform {
  backend "s3" {
    bucket         = "sdlc-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "sdlc-terraform-locks"
    encrypt        = true
  }
}
```

---

## 3. CI/CD パイプライン（AWS CodePipeline + CodeBuild）

### 3.1 パイプライン構成

```
GitHub Push (main/develop)
     |
     v
+---------------------------+
| Source Stage              |
| GitHub Connection (v2)    |
+---------------------------+
     |
     v
+---------------------------+
| Build Stage               |
| CodeBuild                 |
|  1. npm ci (monorepo)     |
|  2. npm run lint          |
|  3. npm run test          |
|  4. npm run build (FE)    |
|  5. esbuild (BE Lambda)  |
+---------------------------+
     |
     v
+---------------------------+
| Deploy-Infra Stage        |
| CodeBuild (Terraform)     |
|  1. terraform init        |
|  2. terraform plan        |
|  3. terraform apply       |
+---------------------------+
     |
     v
+---------------------------+
| Deploy-Frontend Stage     |
| CodeBuild                 |
|  1. aws s3 sync           |
|  2. CloudFront invalidate |
+---------------------------+
     |
     v
+---------------------------+
| Deploy-Backend Stage      |
| CodeBuild                 |
|  1. Lambda 関数更新       |
|  2. Lambda Layer 更新     |
+---------------------------+
```

### 3.2 ブランチ戦略

| ブランチ | 環境 | トリガー |
|---|---|---|
| develop | dev | Push 時に自動デプロイ |
| main | prod | Push 時に自動デプロイ（承認ゲート付き） |

### 3.3 CodeBuild 環境

| 設定項目 | 値 |
|---|---|
| イメージ | aws/codebuild/amazonlinux-aarch64-standard:3.0 |
| コンピュートタイプ | BUILD_GENERAL1_SMALL |
| 環境変数 | AWS_DEFAULT_REGION, ENV (dev/prod), TF_VERSION |
| キャッシュ | S3 キャッシュ（node_modules） |
| IAM ロール | CodeBuild 用ロール（Terraform apply 権限、S3 デプロイ権限、Lambda 更新権限） |

### 3.4 CodePipeline IAM ロール

| ロール | 権限 | 根拠 |
|---|---|---|
| codepipeline-role | CodeBuild 起動、S3 アーティファクト読み書き | パイプライン実行 |
| codebuild-terraform-role | Terraform が管理する全リソースの CRUD | インフラデプロイ |
| codebuild-deploy-role | S3 sync、CloudFront invalidation、Lambda update | アプリデプロイ |

⚠️ codebuild-terraform-role は広範な権限が必要。本番では IAM Permissions Boundary で制約を追加することを推奨。

---

## 4. デプロイ手順

### 4.1 初回セットアップ

```
1. backend-setup をローカルで実行
   cd infra/backend-setup
   terraform init
   terraform apply

2. dev 環境をデプロイ
   cd infra/environments/dev
   terraform init
   terraform plan
   terraform apply

3. フロントエンドビルド・デプロイ
   cd frontend
   npm ci
   npm run build
   aws s3 sync dist/ s3://sdlc-frontend-dev/
   aws cloudfront create-invalidation --distribution-id {id} --paths "/*"

4. バックエンドビルド・デプロイ
   cd backend
   npm ci
   npm run build  # esbuild で各 Lambda をバンドル
   # 各 Lambda 関数を aws lambda update-function-code で更新

5. CodePipeline セットアップ
   cd infra/environments/dev
   # pipeline モジュールを terraform apply（初回のみ手動）
```

### 4.2 通常デプロイ（CI/CD 経由）

```
1. develop ブランチに Push
2. CodePipeline が自動起動
3. Build → Deploy-Infra → Deploy-Frontend → Deploy-Backend
4. dev 環境に自動デプロイ

5. main ブランチに PR マージ
6. CodePipeline が自動起動（承認ゲート付き）
7. 承認後、prod 環境にデプロイ
```

### 4.3 ロールバック手順

| 対象 | ロールバック方法 |
|---|---|
| Terraform | `terraform plan` で差分確認 → 前バージョンの tfstate から `terraform apply` |
| フロントエンド | S3 バージョニングから前バージョンを復元 + CloudFront invalidation |
| Lambda | Lambda バージョン/エイリアスで前バージョンに切り替え |

---

## 5. セキュリティ考慮事項

### 5.1 Terraform 状態ファイルの保護

| 対策 | 設定 |
|---|---|
| 暗号化 | S3 SSE-KMS |
| バージョニング | 有効 |
| パブリックアクセス | 全ブロック |
| ロック | DynamoDB |
| アクセス制御 | IAM ポリシーで CI/CD ロールのみ許可 |

### 5.2 シークレット管理

| シークレット | 保存先 | アクセス |
|---|---|---|
| OAuth Client Secret | SSM Parameter Store (SecureString) | Lambda IAM ロール |
| VAPID 秘密鍵 | SSM Parameter Store (SecureString) | Lambda IAM ロール |
| KMS 鍵 | AWS KMS | Lambda IAM ロール |
| Terraform 状態 | S3 (SSE-KMS) | CI/CD IAM ロール |

### 5.3 SECURITY ルール準拠チェック

| ルール | インフラ対応 |
|---|---|
| SECURITY-01 | DynamoDB: AWS managed key、S3: SSE-S3/SSE-KMS、CloudFront: TLS 1.2+ |
| SECURITY-02 | API Gateway: アクセスログ + 実行ログ、CloudFront: 標準ログ |
| SECURITY-04 | CloudFront Response Headers Policy（CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy） |
| SECURITY-06 | Lambda IAM: テーブル単位・アクション単位の最小権限 |
| SECURITY-07 | N/A（サーバーレス、VPC なし） |
| SECURITY-08 | API Gateway Cognito JWT Authorizer、CORS API Gateway 集約管理（ワイルドカード禁止） |
| SECURITY-09 | S3: パブリックアクセス全ブロック、Terraform 状態: 暗号化 + アクセス制御 |
| SECURITY-10 | Terraform: バージョン固定、Lambda Layer: バージョン管理 |
| SECURITY-14 | CloudWatch: 5種アラーム、ログ保持 dev:30日/prod:180日、X-Ray トレーシング、S3 ログバケット ライフサイクルポリシー（Standard→Standard-IA→Glacier IR→削除） |
