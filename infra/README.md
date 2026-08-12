# インフラ構築・デプロイ手順

## 前提

| 項目 | 値 |
|---|---|
| AWS アカウント | `441713519216`（個人 Identity Center: https://otaka.awsapps.com/start） |
| プロファイル | `sdlc-admin` |
| リージョン | `ap-northeast-1`（Identity Center のみ `us-east-1`） |
| Terraform | `>= 1.9.0` |

### 誤アカウント適用の防止

開発端末には多数の業務アカウントのプロファイルが同居しているため、二重にガードしている。

- `infra/environments/*/backend.tf` の `provider.allowed_account_ids` — 別アカウントなら `terraform plan` が失敗する
- `scripts/lib/check-aws-account.sh` — デプロイスクリプトがビルド前にアカウントを検証する

アカウント ID を変更する場合は上記2箇所を両方直すこと。

### ログイン

```bash
aws sso login --profile sdlc-admin
export AWS_PROFILE=sdlc-admin
```

---

## 初回のみ: Terraform backend のブートストラップ

state を置く S3 バケットとロック用 DynamoDB テーブルは、Terraform 自身では管理できない（鶏卵問題）ため CLI で作成する。**構築済みなので通常は不要**。再構築が必要になった場合の手順:

```bash
BUCKET=sdlc-terraform-state-441713519216   # S3 は全世界で名前空間共有のためアカウント ID を付与

aws s3api create-bucket --bucket "$BUCKET" --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws dynamodb create-table --table-name sdlc-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

---

## 通常の構築手順

### 1. 共通 Lambda Layer のビルド

`aws_lambda_layer_version.common` が参照する zip を生成する。**`terraform apply` の前に必須**（生成物は git 管理外）。

```bash
./scripts/build-layer.sh
```

`backend/package.json` の `@aws-lambda-powertools/*` と `@aws-sdk/*` を単一の情報源として読み取るため、アプリ側とレイヤー側でバージョンがずれない。Powertools の logger/tracer/metrics/commons が同一バージョンかも検証する。

### 2. terraform.tfvars の作成

```bash
cd infra/environments/dev
cp terraform.tfvars.example terraform.tfvars
# sns_alert_email に実際のアラート通知先を設定する
```

`*.tfvars` は git 管理外。

### 3. plan / apply

```bash
cd infra/environments/dev   # または prod
terraform init
terraform plan
terraform apply
```

### 4. アプリケーションのデプロイ

Terraform が作る Lambda はプレースホルダーコードなので、実コードを別途配布する。

```bash
./scripts/deploy-backend.sh dev
./scripts/deploy-frontend.sh dev
```

`deploy-backend.sh` は esbuild 出力（`dist/handlers/**/*.mjs`）を関数ごとに `index.mjs` へリネームして zip 化し、`update-function-code` で配布する（Terraform 側の `handler = "index.handler"` と対応）。

---

## 環境ごとの差異

| 項目 | dev | prod |
|---|---|---|
| `AI_GATEWAY_DRY_RUN` | `true`（Bedrock を呼ばずコスト $0） | `false` |
| `LOG_LEVEL` | `DEBUG` | `INFO` |
| ログ保持期間 | 30日 | 180日 |
| `allowed_origin` | `http://localhost:5173` | CloudFront ドメイン（デプロイ後に更新） |

dev で実際に Bedrock を呼ぶ場合は `AI_GATEWAY_DRY_RUN` を `false` にすること。

---

## プロンプトテンプレートの投入

`deploy-backend.sh` が Lambda コード配布の直後に `aws lambda invoke` でシーダーを起動する。

当初は Terraform の CloudFormation Custom Resource で apply 中に投入する設計だったが、
apply 時点の Lambda にはプレースホルダーコードしか載っておらず応答プロトコルを満たせないため、
Custom Resource が1時間ハングして失敗する。この方式は採用していない。

テンプレート定義（`prompt_templates`）とバージョン（`prompt_template_version`）は
Terraform から Lambda の環境変数として渡している。プロンプト本文は esbuild の
text loader でバンドルに埋め込まれる（実行時 `readFileSync` は使わない）。

## 既知の注意点

- **`deploy-backend.sh` は AWS 上に存在しない関数をスキップして非ゼロ終了する** —
  Terraform 未 apply の状態で走らせた場合に「何もデプロイしていないのに成功」に見えないための挙動。
  スキップされた関数名が一覧表示されるので、apply 漏れかどうかを確認すること

- **CloudWatch アラームの dimensions 未指定** — Powertools Metrics は `service` ディメンションを自動付与するため、現状のアラームがメトリクスに一致しない可能性がある。デプロイ後にコンソールで実ディメンションを確認して追加すること
- **`ErrorCount` の名前空間** — `create-handler.ts` が `SDLC/Foundation` に送出しているため、`SDLC/AIGateway` を見ている `ai_error_count` アラームは現状無反応。Unit 6 でメトリクス名前空間を整理する予定
- **`aws_api_gateway_method` が deployment の triggers 未登録** — resource と integration のみ登録済み。`authorization` だけを変更した場合に再デプロイが走らない
- **`allowed_origin`（prod）** — `CLOUDFRONT_DOMAIN` のままなので、CloudFront 構築後に実ドメインへ更新が必要
