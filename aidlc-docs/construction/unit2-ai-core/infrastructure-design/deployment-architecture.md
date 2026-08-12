# Unit 2: AI Core — デプロイアーキテクチャ

---

## 1. Unit 1 インフラとの関係

Unit 2 は Unit 1 で構築済みの以下を共有・拡張:

| 共有リソース | Unit 1 で構築済み | Unit 2 で追加 |
|---|---|---|
| API Gateway | REST API, Cognito Authorizer, ステージ | エンドポイント3本（/recommend, /dont-deploy, /meta-response） |
| DynamoDB | AppData テーブル（スキーマ定義済み） | SYSTEM スコープのプロンプトテンプレート（データ投入） |
| Lambda Layer | sdlc-common-layer（Powertools, Zod） | 共有（追加不要） |
| CloudWatch | SNS トピック、既存アラーム | アラーム5本追加 |
| IAM | 既存ロール（auth, mfa, presignup, backup） | sdlc-ai-role, sdlc-prompt-seeder-role 追加 |

---

## 2. デプロイ手順（Unit 2 固有）

### 2.1 初回デプロイ

```bash
# 1. Terraform で IAM ロール + Lambda 関数 + Custom Resource を作成
cd infra/environments/dev
terraform plan   # 差分確認（ai-role, Lambda 3本, prompt-seeder, Custom Resource）
terraform apply

# 2. Custom Resource が自動実行 → プロンプトテンプレートを DynamoDB に投入
# → CloudFormation Events で seeder Lambda の実行結果を確認

# 3. Lambda 関数コードをデプロイ
cd backend
npm run build
./scripts/deploy-backend.sh dev
# → post-recommend, post-dont-deploy, post-meta-response, prompt-seeder を更新

# 4. 動作確認（ドライラン）
# AI_GATEWAY_DRY_RUN=true で Lambda を呼び出し、プロンプト生成を確認
aws lambda invoke --function-name sdlc-post-recommend-dev \
  --payload '{"body":"{...}","requestContext":{"authorizer":{"claims":{"sub":"test","email":"test@example.com"}}}}' \
  /dev/stdout
```

### 2.2 プロンプトテンプレート更新

```bash
# terraform.tfvars の prompt_template_version をインクリメント
prompt_template_version = "2"  # 1 → 2

# Terraform apply で Custom Resource が Update → seeder Lambda が新バージョンを DynamoDB に投入
terraform apply

# 旧バージョンは DynamoDB に残存（ロールバック可能）
```

### 2.3 モデルバージョン更新

```bash
# terraform.tfvars の prompt_templates 内 modelId を更新
# 例: Sonnet v2 → v3 が GA された場合
modelId = "anthropic.claude-3-5-sonnet-YYYYMMDD-v3:0"

# prompt_template_version もインクリメント
terraform apply
```

---

## 3. 環境別差分

| 設定 | dev | prod |
|---|---|---|
| AI_GATEWAY_DRY_RUN | true（デフォルト。手動で false に切替可） | false |
| RECOMMEND_DAILY_LIMIT | 3 | 3 |
| Lambda メモリ | 512MB | 512MB |
| Lambda タイムアウト (recommend) | 20秒 | 20秒 |
| Lambda タイムアウト (dont-deploy/meta) | 10秒 | 10秒 |
| ログ保持 | 30日 | 180日 |
| アラーム通知先 | dev-alerts@example.com | prod-alerts@example.com |

---

## 4. Bedrock モデルアクセス設定

### モデルアクセスの有効化（手動、初回のみ）

AWS コンソール → Bedrock → Model access で以下を有効化:
- Anthropic Claude 3.5 Sonnet
- Anthropic Claude 3 Haiku

⚠️ Terraform では管理不可（コンソール操作のみ）。デプロイ手順書に「前提条件」として記載。

---

## 5. SECURITY 準拠チェック（Unit 2 追加分）

| ルール | インフラ対応 |
|---|---|
| SECURITY-01 | DynamoDB（既存、AWS managed key）、Bedrock 通信は TLS 1.2+ |
| SECURITY-03 | Powertools Logger（Lambda Layer 共有）、AI レスポンスはログに含めない（PII 可能性） |
| SECURITY-05 | Zod バリデーション（入力 + AI 出力）、Tool Use スキーマ制約 |
| SECURITY-06 | sdlc-ai-role: bedrock:InvokeModel は Claude モデルのみ。DynamoDB は必要テーブル・アクションのみ |
| SECURITY-09 | AI エラー時は汎用メッセージ返却（Bedrock エラー詳細は非公開） |
| SECURITY-11 | 推薦回数制限 3回/日（DynamoDB アトミック） + API Gateway ステージスロットリング（Unit 1）。⚠️ dont-deploy/meta-response は日次回数制限なし（意図的受容）。バックストップは Unit 1 のユーザーレベルレート制限（100 req/min）のみ。最悪ケース: 100 req/min × $0.0007 × 60min × 24h ≈ $100/日/ユーザー。攻撃検知は sdlc-ai-error-rate アラーム + Cognito Advanced Security（prod）で対応。将来的にソフトキャップ（例: dont-deploy 30回/日）追加を検討 |
| SECURITY-14 | CloudWatch アラーム5本追加、ロググループ保持 dev:30日/prod:180日 |

---

## 6. ロールバック手順

| 対象 | ロールバック方法 |
|---|---|
| Lambda 関数コード | Lambda バージョン/エイリアスで前バージョンに切り替え |
| プロンプトテンプレート | DynamoDB に旧バージョンが残存。prompt_template_version を戻して apply |
| Bedrock モデル変更 | terraform.tfvars の modelId を戻して apply → Custom Resource Update |
| IAM ロール変更 | Terraform plan で差分確認 → 必要に応じて revert |
