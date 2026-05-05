# ビルド手順

## 前提条件

| 項目 | 要件 |
|---|---|
| Node.js | 22.x LTS |
| npm | 10.x 以上 |
| Terraform | 1.9.x 以上 |
| AWS CLI | 2.x（デプロイ時） |
| OS | macOS / Linux |

## 環境変数

### バックエンド（Lambda 実行時）
| 変数 | 説明 | 例 |
|---|---|---|
| USERS_TABLE | Users テーブル名 | sdlc-users-dev |
| TASTE_PROFILES_TABLE | TasteProfiles テーブル名 | sdlc-taste-profiles-dev |
| APP_DATA_TABLE | AppData テーブル名 | sdlc-app-data-dev |
| SAKENOWA_CACHE_TABLE | SakenowaCache テーブル名 | sdlc-sakenowa-cache-dev |
| ALLOWED_ORIGIN | CORS 許可オリジン | http://localhost:5173 |
| LOG_LEVEL | ログレベル | DEBUG |
| POWERTOOLS_SERVICE_NAME | Powertools サービス名 | signup-handler |
| KMS_RECOVERY_CODES_KEY_ID | KMS キー ID | alias/sdlc-recovery-codes-dev |
| COGNITO_USER_POOL_ID | Cognito User Pool ID | ap-northeast-1_xxxxx |
| BACKUP_BUCKET | バックアップ S3 バケット | sdlc-logs-dev |

### フロントエンド（ビルド時）
| 変数 | 説明 | 例 |
|---|---|---|
| VITE_API_BASE_URL | API ベース URL | https://xxx.execute-api.ap-northeast-1.amazonaws.com/dev |
| VITE_COGNITO_USER_POOL_ID | Cognito User Pool ID | ap-northeast-1_xxxxx |
| VITE_COGNITO_CLIENT_ID | Cognito App Client ID | xxxxxxxxxxxxxxxxx |
| VITE_COGNITO_DOMAIN | Cognito ドメイン | sdlc-dev |

## ビルドステップ

### 1. 依存関係インストール

```bash
# リポジトリルートで実行（monorepo ワークスペース）
npm ci
```

### 2. 型チェック

```bash
# shared-types
cd packages/shared-types && npm run typecheck && cd ../..

# バックエンド
cd backend && npm run typecheck && cd ..

# フロントエンド
cd frontend && npm run typecheck && cd ..
```

### 3. リント

```bash
npm run lint
```

### 4. バックエンドビルド（Lambda バンドル）

```bash
cd backend
npm run build
# 出力: backend/dist/ 配下に各ハンドラーの .mjs ファイル
```

### 5. フロントエンドビルド（SPA）

```bash
cd frontend
npm run build
# 出力: frontend/dist/ 配下に index.html + assets/
```

### 5b. バンドルサイズ分析（200KB 目標確認）

```bash
cd frontend
npx vite-bundle-visualizer
# ブラウザで分析結果が表示される

# gzip サイズ確認
gzip -c dist/assets/index-*.js | wc -c
# 目標: 200KB (204800 bytes) 以内
```

### 6. Terraform 初期化（インフラ）

```bash
cd infra/environments/dev
terraform init
terraform plan
# 確認後: terraform apply
```

## ビルド成果物

| 成果物 | パス | 説明 |
|---|---|---|
| Lambda バンドル | backend/dist/handlers/auth/*.mjs | esbuild でバンドルされた Lambda 関数 |
| SPA ビルド | frontend/dist/ | Vite でビルドされた静的ファイル |
| Terraform Plan | infra/environments/dev/ | インフラ変更計画 |

## トラブルシューティング

### npm ci が失敗する
- **原因**: Node.js バージョン不一致
- **解決**: `node --version` で 22.x を確認。nvm を使用: `nvm use 22`

### TypeScript コンパイルエラー
- **原因**: shared-types の参照解決失敗
- **解決**: `npm ci` をルートで再実行（ワークスペースリンク再構築）

### esbuild バンドルエラー
- **原因**: 外部パッケージの解決失敗
- **解決**: `backend/esbuild.config.mjs` の `external` 配列を確認

### Terraform init 失敗
- **原因**: S3 バックエンドへのアクセス権限不足
- **解決**: AWS CLI の認証情報を確認。`aws sts get-caller-identity` で確認
