# 統合テスト手順

## 目的

Unit 1 Foundation のコンポーネント間の連携を検証する。Lambda ハンドラー → DynamoDB、フロントエンド → API Gateway → Lambda の統合動作を確認。

## テスト環境

### ローカル統合テスト（推奨）

| ツール | 用途 |
|---|---|
| DynamoDB Local | DynamoDB のローカルエミュレーション |
| msw (Mock Service Worker) | API モック（フロントエンド） |
| Vitest | テストランナー |

### AWS 統合テスト（dev 環境）

Terraform で dev 環境をデプロイ後、実際の AWS サービスに対してテスト。

## テストシナリオ

### シナリオ 1: ユーザー登録フロー（US-01）

```
SignupPage → Cognito signUp → Pre Sign-up Trigger → 確認メール
→ OnboardingPage → POST /signup → Users テーブル + TasteProfiles テーブル
```

**テスト手順**:
1. DynamoDB Local を起動（テーブル作成済み）
2. signup-handler を直接呼び出し（API Gateway イベントをモック）
3. Users テーブルに User レコードが作成されることを検証
4. TasteProfiles テーブルに初期プロファイル（全軸 0.5）が作成されることを検証
5. disclosureLevel が sakeExperience に応じて正しく設定されることを検証

**期待結果**:
- 201 Created レスポンス
- Users テーブルに SK=PROFILE のレコード
- TasteProfiles テーブルに f1〜f6 = 0.5 のレコード
- トランザクション整合性（片方だけ作成されない）

### シナリオ 2: プロファイル取得・更新フロー

```
GET /profile → Users テーブル読み取り
PUT /profile → Users テーブル更新 → 更新後データ返却
```

**テスト手順**:
1. Users テーブルにテストデータを投入
2. get-profile を呼び出し → レスポンスに recoveryCodes が含まれないことを検証
3. put-profile を呼び出し（nickname 更新）→ 更新後データを検証
4. 存在しない userId で get-profile → 404 を検証

### シナリオ 3: 開示レイヤー更新フロー（US-29）

```
PUT /disclosure-level (unlock_category: type) → Users テーブル更新
PUT /disclosure-level (unlock_all) → disclosureLevel = 3
```

**テスト手順**:
1. disclosureLevel=1 のユーザーを作成
2. unlock_category: type → unlockedCategories に "type" が追加されることを検証
3. 同じカテゴリを再度解放 → 冪等性を検証（重複なし）
4. unlock_all → disclosureLevel=3、unlockedCategories=[] を検証
5. 既に Level 3 のユーザーに unlock_all → 変化なし（冪等性）

### シナリオ 4: レート制限（SECURITY-11）

```
100回リクエスト → 成功
101回目 → 429 Too Many Requests
```

**テスト手順**:
1. AppData テーブルにレート制限カウンターを直接設定（requestCount=99）
2. リクエスト → 成功（カウンター 100 に増加）
3. リクエスト → 429 RateLimitError
4. TTL 経過後 → カウンターリセット確認

### シナリオ 5: MFA フロー（US-02B）

```
POST /mfa/setup → TOTP シークレット取得
POST /mfa/verify → MFA 有効化
POST /mfa/recovery-codes → リカバリーコード発行
DELETE /mfa → MFA 無効化（TOTP コード検証付き）
```

**テスト手順**:
1. Cognito SDK をモック（AssociateSoftwareToken, VerifySoftwareToken, SetUserMFAPreference）
2. mfa-setup → secretCode と otpauthUri が返却されることを検証
3. mfa-verify → Users テーブルの mfaEnabled=true を検証
4. recovery-codes → 10個のコードが返却、DynamoDB にハッシュ保存を検証
5. delete-mfa（有効な TOTP コード）→ mfaEnabled=false、recoveryCodes 削除を検証

## ローカル統合テスト環境セットアップ

### DynamoDB Local

```bash
# Docker で起動
docker run -d -p 8000:8000 amazon/dynamodb-local

# テーブル作成（スクリプト）
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name sdlc-users-dev \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=entityType,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=entityType,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# 他テーブルも同様に作成
```

### 環境変数（ローカル統合テスト用）

```bash
export AWS_ENDPOINT_URL=http://localhost:8000
export USERS_TABLE=sdlc-users-dev
export TASTE_PROFILES_TABLE=sdlc-taste-profiles-dev
export APP_DATA_TABLE=sdlc-app-data-dev
export ALLOWED_ORIGIN=http://localhost:5173
export LOG_LEVEL=DEBUG
```

## 実行コマンド

```bash
# ローカル統合テスト（DynamoDB Local 使用）
cd backend
npx vitest run tests/integration/

# AWS dev 環境統合テスト
cd backend
AWS_PROFILE=sdlc-dev npx vitest run tests/integration/ --env=aws
```

## クリーンアップ

```bash
# DynamoDB Local 停止
docker stop $(docker ps -q --filter ancestor=amazon/dynamodb-local)

# テストデータ削除（dev 環境）
# 必要に応じて DynamoDB テーブルのテストデータを削除
```
