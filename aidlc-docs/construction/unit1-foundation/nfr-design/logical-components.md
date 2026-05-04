# Unit 1: Foundation — 論理コンポーネント

---

## 1. バックエンド論理コンポーネント

### 1.1 Lambda ミドルウェアスタック

AWS Powertools for TypeScript をベースとした共通ミドルウェア:

| コンポーネント | パッケージ | 責務 | SECURITY ルール |
|---|---|---|---|
| Logger | `@aws-lambda-powertools/logger` | 構造化ログ、correlationId 自動付与、PII マスク | SECURITY-03 |
| Tracer | `@aws-lambda-powertools/tracer` | X-Ray トレーシング、AWS SDK 自動計装 | SECURITY-14 |
| Metrics | `@aws-lambda-powertools/metrics` | カスタムメトリクス送出（EMF 形式） | SECURITY-14 |
| RateLimiter | カスタム（DynamoDB アトミック演算） | ユーザーレベルレート制限（100 req/min、スライディングウィンドウ） | SECURITY-11 |
| ZodValidator | カスタム（Zod ラッパー） | リクエストボディ/パスパラメータ/クエリの型安全バリデーション | SECURITY-05 |
| ErrorHandler | カスタム | グローバルエラーキャッチ、構造化エラーレスポンス生成、Fail-closed | SECURITY-09, 15 |
| AuthExtractor | カスタム | JWT claims から userId 抽出、リクエストコンテキストに注入 | SECURITY-08 |

### ミドルウェア適用パターン

```typescript
// 全ハンドラーで使用する共通ラッパー
// packages/shared-types/src/middleware.ts

import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics } from '@aws-lambda-powertools/metrics';

// 各ハンドラーでの使用例:
// export const handler = createHandler({
//   schema: signupRequestSchema,  // Zod スキーマ
//   handler: async (event, context) => { ... }
// });
```

### 1.2 DynamoDB アクセス層

| コンポーネント | 責務 |
|---|---|
| DynamoDBClient | シングルトン接続（keepAlive: true）。Powertools Tracer で自動計装 |
| TableConfig | テーブル名の環境変数マッピング（`USERS_TABLE`, `TASTE_PROFILES_TABLE`, `DRINKING_LOGS_TABLE`, `APP_DATA_TABLE`） |
| KeyBuilder | PK/SK の生成ユーティリティ（`USER#${userId}`, `TOKEN#${provider}`, `LOG#${timestamp}` 等） |
| EntityMapper | DynamoDB Item ⇔ ドメインオブジェクト変換（Zod スキーマベース） |

### DynamoDB テーブル詳細設計

#### Users テーブル
```
+------------------------------------------------------------------+
| Users テーブル                                                    |
|                                                                  |
| PK: userId (string)                                              |
| SK: entityType (string)                                          |
|                                                                  |
| エンティティパターン:                                             |
|   SK = "PROFILE"       -> User エンティティ                      |
|   SK = "TOKEN#google"  -> Google OAuth トークン (Unit 5)         |
|   SK = "TOKEN#apple"   -> Apple OAuth トークン (Unit 5)          |
|                                                                  |
| ※ SK = "TOKEN#..." は Unit 5 (External Integration) 用の        |
|   スキーマ予約。Unit 1 ではスキーマ定義のみ行い、               |
|   データアクセスロジックは Unit 5 で実装する。                   |
|                                                                  |
| GSI1 (email-index):                                              |
|   PK: email, SK: userId                                          |
|   用途: ソーシャルログイン時のアカウント紐付け検索               |
|                                                                  |
| 設定:                                                            |
|   暗号化: AWS managed key                                        |
|   PITR: 有効 (35日間)                                            |
|   TTL: なし (ユーザーデータは永続)                               |
+------------------------------------------------------------------+
```

#### TasteProfiles テーブル
```
+------------------------------------------------------------------+
| TasteProfiles テーブル                                            |
|                                                                  |
| PK: userId (string)                                              |
| SK: なし (単一エンティティ)                                      |
|                                                                  |
| 属性: f1-f6 (number, 0.0-1.0), updatedAt                        |
|                                                                  |
| 設定:                                                            |
|   暗号化: AWS managed key                                        |
|   PITR: 有効 (35日間)                                            |
|   TTL: なし                                                      |
+------------------------------------------------------------------+
```

#### DrinkingLogs テーブル
```
+------------------------------------------------------------------+
| DrinkingLogs テーブル                                             |
|                                                                  |
| PK: userId (string)                                              |
| SK: LOG#{ISO8601 timestamp} (string)                             |
|                                                                  |
| GSI1 (sake-index):                                               |
|   PK: sakeId, SK: timestamp                                     |
|   用途: 銘柄別の飲酒記録検索 (Unit 3)                           |
|                                                                  |
| 設定:                                                            |
|   暗号化: AWS managed key                                        |
|   PITR: 有効 (35日間)                                            |
|   TTL: なし                                                      |
+------------------------------------------------------------------+
```

#### AppData テーブル
```
+------------------------------------------------------------------+
| AppData テーブル                                                  |
|                                                                  |
| PK: userId (string)                                              |
| SK: dataType (string)                                            |
|                                                                  |
| エンティティパターン:                                             |
|   SK = "NOTIFICATION"       -> 通知設定                          |
|   SK = "SETTING#{key}"      -> アプリ設定                        |
|   SK = "RATELIMIT#{window}" -> レート制限カウンター              |
|                                                                  |
| 設定:                                                            |
|   暗号化: AWS managed key                                        |
|   PITR: 有効 (35日間)                                            |
|   TTL: 有効 (RATELIMIT エントリの自動削除)                       |
+------------------------------------------------------------------+
```

#### SakenowaCache テーブル
```
+------------------------------------------------------------------+
| SakenowaCache テーブル                                            |
|                                                                  |
| PK: dataType (string)                                            |
|   "areas" / "brands" / "breweries" / "rankings" /                |
|   "flavor-charts" / "flavor-tags" / "brand-flavor-tags"          |
| SK: なし                                                         |
|                                                                  |
| 属性:                                                            |
|   data (string/JSON) - APIレスポンス全体                         |
|   fetchedAt (ISO8601) - 取得日時                                 |
|   ttl (number) - DynamoDB TTL (Unix epoch + 86400秒)             |
|                                                                  |
| 設計根拠:                                                        |
|   - グローバルデータ (全ユーザー共通、PK: dataType)              |
|   - AppData (PK: userId) とキースキーマが異なるため独立維持      |
|   - TTL で 24h 後に自動期限切れ                                  |
|   - CM-02 SakenowaClient が直接アクセス                          |
|   - FR-01, FR-03, FR-04 が依存                                   |
|                                                                  |
| 設定:                                                            |
|   暗号化: AWS managed key                                        |
|   PITR: 無効 (キャッシュデータのため復元不要)                    |
|   TTL: 有効 (24h 自動期限切れ)                                   |
+------------------------------------------------------------------+
```

### 1.3 エラーハンドリング層

| コンポーネント | 責務 |
|---|---|
| AppError（基底クラス） | code, message, statusCode, details を持つカスタムエラー |
| ValidationError | 400: Zod バリデーション失敗時 |
| AuthError | 401: トークン無効・期限切れ |
| ForbiddenError | 403: リソースアクセス権なし |
| NotFoundError | 404: リソース不存在 |
| RateLimitError | 429: レート制限超過 |
| InternalError | 500: 予期しないエラー（詳細はログのみ） |

### エラーハンドリングフロー

```
ビジネスロジック
     |
     | throw AppError (既知エラー)
     | throw Error (未知エラー)
     v
+----------------------------------+
| ErrorHandler ミドルウェア        |
|                                  |
| AppError の場合:                 |
|   -> statusCode + 構造化レスポンス|
|   -> Logger.warn()              |
|                                  |
| 未知 Error の場合:               |
|   -> 500 + 汎用メッセージ       |
|   -> Logger.error() + スタック  |
|   -> Metrics: ErrorCount +1     |
+----------------------------------+
     |
     v
+----------------------------------+
| レスポンス                       |
| { code, message, details? }     |
+----------------------------------+
```

---

## 2. フロントエンド論理コンポーネント

### 2.1 API クライアント層（ky ベース）

| コンポーネント | 責務 |
|---|---|
| apiClient | ky インスタンス（baseURL, リトライ設定, タイムアウト） |
| authHook (beforeRequest) | Authorization ヘッダー自動付与 |
| refreshHook (afterResponse) | 401 時のトークンリフレッシュ + リトライ |
| errorHook (beforeError) | エラーレスポンスのパース・正規化 |

### API クライアント設計

```typescript
// frontend/src/lib/api-client.ts

import ky from 'ky';

const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  retry: {
    limit: 2,
    methods: ['get', 'put', 'delete'],
    statusCodes: [408, 500, 502, 503, 504],
    backoffLimit: 600,
  },
  hooks: {
    beforeRequest: [/* authHook */],
    afterResponse: [/* refreshHook */],
    beforeError: [/* errorHook */],
  },
});
```

### 2.2 認証状態管理

| コンポーネント | 責務 |
|---|---|
| AuthProvider | AuthContext + useReducer。トークン管理、自動リフレッシュ |
| useAuth | AuthContext のカスタムフック。login, logout, refreshToken |
| ProtectedRoute | 認証ガード。未認証時は /login にリダイレクト |
| tokenStorage | localStorage ラッパー。トークンの保存・取得・削除 |

### トークンリフレッシュフロー

```
API 呼び出し (ky)
     |
     | 401 レスポンス
     v
+---------------------------+
| refreshHook               |
| 1. refreshToken 取得      |
| 2. Cognito SDK で更新     |
+---------------------------+
     |
     | 成功
     v
+---------------------------+
| tokenStorage 更新         |
| AuthContext 更新           |
| 元リクエストをリトライ    |
+---------------------------+
     |
     | 失敗（refreshToken 期限切れ）
     v
+---------------------------+
| logout()                  |
| tokenStorage クリア       |
| /login にリダイレクト     |
+---------------------------+
```

### 2.3 多言語（i18n）コンポーネント

| コンポーネント | 責務 |
|---|---|
| i18nConfig | react-i18next 初期化。namespace 分割、遅延ロード |
| LanguageDetector | Accept-Language → localStorage → ユーザー設定の優先順位で言語検出 |
| LanguageSwitcher | 言語切替 UI。i18n.changeLanguage + localStorage + API 同期 |

### namespace 構成

| namespace | 内容 | ロードタイミング |
|---|---|---|
| common | 共通 UI テキスト（ボタン、ラベル、エラーメッセージ） | 初期ロード |
| auth | 認証関連テキスト（ログイン、サインアップ、MFA） | 初期ロード |
| settings | 設定画面テキスト | 遅延ロード |
| plan | Plan タブテキスト（Unit 2） | 遅延ロード |
| build | Build タブテキスト（Unit 3） | 遅延ロード |
| errors | エラーメッセージ（code → ローカライズメッセージ） | 初期ロード |

### 初期ロード namespace サイズ概算

| namespace | 想定キー数 | JSON サイズ概算（1言語あたり） | 根拠 |
|---|---|---|---|
| common | ~50 キー | ~1.5KB | ボタン・ラベル・ナビゲーション等の短文 |
| auth | ~40 キー | ~2.0KB | フォームラベル・バリデーションメッセージ・MFA案内（やや長文含む） |
| errors | ~15 キー | ~0.5KB | エラーコード → 短文メッセージ |
| 合計（1言語） | ~105 キー | ~4.0KB | — |
| 合計（ja + en 同時ロード） | — | ~8.0KB | 初期は選択言語のみロード。切替時にオンデマンド取得 |

初期ロードでは選択言語の1ファイルのみ（~4KB、gzip 後 ~1.5KB）。200KB バンドルバジェットへの影響は軽微（< 1%）。

---

## 3. PWA / Service Worker コンポーネント

### 3.1 Workbox 構成

| コンポーネント | 責務 |
|---|---|
| precacheManifest | ビルド時生成。静的アセット（JS, CSS, フォント, アイコン）のプリキャッシュリスト |
| runtimeCaching | API レスポンスのランタイムキャッシュ戦略定義 |
| backgroundSync | オフライン時の書き込みキュー（IndexedDB） |
| offlineFallback | オフラインフォールバックページ |

### キャッシュ戦略マッピング

| URL パターン | 戦略 | 設定 |
|---|---|---|
| `/assets/*` | CacheFirst | maxEntries: 100, maxAgeSeconds: 2592000 (30日) |
| `/api/*` | NetworkFirst | networkTimeoutSeconds: 3, maxEntries: 50, maxAgeSeconds: 3600 (1h) |
| `muro.sakenowa.com/*` | CacheFirst | maxAgeSeconds: 86400 (24h), maxEntries: 200 |
| `/locales/*` | StaleWhileRevalidate | maxEntries: 10 |

### 3.2 Web App Manifest

```json
{
  "name": "SDLC - Sake Driven Life Cycle",
  "short_name": "SDLC",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 4. インフラ論理構成

### 4.1 全体アーキテクチャ

```
ユーザー (ブラウザ / PWA)
     |
     | HTTPS
     v
+----------------------------------+
| CloudFront                       |
| - Response Headers Policy        |
|   (セキュリティヘッダー)         |
| - OAC (S3 アクセス制御)          |
+----------------------------------+
     |                    |
     | /assets/*          | /api/*
     v                    v
+-----------+    +------------------+
| S3        |    | API Gateway      |
| (SPA)     |    | - Cognito Auth   |
+-----------+    | - ステージ変数   |
                 | - スロットリング |
                 +------------------+
                      |
                      v
                 +------------------+
                 | Lambda           |
                 | - Powertools     |
                 | - Zod            |
                 +------------------+
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
     +--------+ +----------+ +--------+
     | Users  | | Taste    | | App    |
     | Table  | | Profiles | | Data   |
     +--------+ +----------+ +--------+
                                  |
     +--------+                   |
     |Sakenowa|                   |
     | Cache  |                   |
     +--------+                   |
          |
          v
     +------------------+
     | Cognito          |
     | - User Pool      |
     | - Pre Sign-up    |
     |   Lambda Trigger |
     | - Advanced       |
     |   Security       |
     +------------------+
```

### 4.2 Terraform モジュール構成（更新）

| モジュール | リソース | 備考 |
|---|---|---|
| cognito | User Pool, App Client, Identity Pool, MFA設定, Pre Sign-up Lambda Trigger, Advanced Security | — |
| api-gateway | REST API, Cognito Authorizer, ステージ, 2層スロットリング, アクセスログ, CORS | — |
| dynamodb | 5テーブル（Users, TasteProfiles, DrinkingLogs, SakenowaCache, AppData）、GSI、暗号化、PITR、TTL | 6→5テーブルに統合（UserTokens→Users、NotificationSettings→AppData。SakenowaCache は独立維持） |
| s3-cloudfront | SPA バケット, CloudFront Distribution, OAC, Response Headers Policy | — |
| lambda-base | 共通 Lambda Layer (Powertools, Zod), IAM ロール, CloudWatch ロググループ (180日) | — |
| monitoring | CloudWatch アラーム (5xx, Lambda エラー, DynamoDB スロットル, DLQ), SNS トピック, X-Ray 設定 | — |

### 4.3 IAM 最小権限設計（SECURITY-06 準拠）

| Lambda 関数群 | DynamoDB 権限 | その他権限 |
|---|---|---|
| signup-handler | Users: PutItem, TasteProfiles: PutItem | — |
| get-profile | Users: GetItem | — |
| put-profile | Users: UpdateItem | — |
| put-disclosure-level | Users: UpdateItem | — |
| cognito-pre-signup-trigger | — | Secrets Manager: GetSecretValue（ブロックリスト設定） |
| mfa-recovery-codes | Users: UpdateItem | KMS: Encrypt（リカバリーコードハッシュ） |
| cognito-daily-backup | — | Cognito: ListUsers, S3: PutObject |
| sync-sakenowa-data | SakenowaCache: PutItem, GetItem | — |

---

## 5. 共有型定義（packages/shared-types）

### 5.1 Zod スキーマ（FE/BE 共有）

| スキーマ | 用途 | バリデーションルール |
|---|---|---|
| signupRequestSchema | POST /signup | nickname: 2-20文字（BR-03-01, 02）, locale: ja/en, sakeExperience?: enum（任意） |
| updateProfileSchema | PUT /profile | nickname?, locale?, sakeExperience?（部分更新） |
| updateDisclosureLevelSchema | PUT /disclosure-level | action: "unlock_category" / "unlock_all", category?: enum(type, region, temperature)。Layer 2 カテゴリのみ |
| userResponseSchema | API レスポンス | User エンティティの出力型（disclosureLevel, unlockedCategories 含む） |
| errorResponseSchema | エラーレスポンス | code: enum, message: string, details?: array |
| mfaRecoveryCodesSchema | POST /mfa/recovery-codes レスポンス | codes: string[10] |

### 5.2 CM-01 AIGateway インターフェース（スタブ）

```typescript
// packages/shared-types/src/ai-gateway.ts

export interface AIGatewayRequest {
  templateId: string;
  modelId: string;
  input: Record<string, unknown>;
  cacheKey?: string;
}

export interface AIGatewayResponse {
  output: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  latencyMs: number;
}

// Unit 1 ではスタブ実装（固定レスポンス返却）
// Unit 2 で Bedrock 本実装に差し替え
```

### 5.3 CM-02 SakenowaClient インターフェース（スタブ）

```typescript
// packages/shared-types/src/sakenowa-client.ts

export interface SakenowaArea {
  id: number;
  name: string;
}

export interface SakenowaBrand {
  id: number;
  name: string;
  areaId: number;
}

export interface SakenowaRanking {
  brandId: number;
  score: number;
  rank: number;
}

// Unit 1 ではスタブ実装（キャッシュ済みサンプルデータ返却）
// Unit 3 で API 本実装に差し替え
```

---

## 6. テーブル統合による変更影響

NFR Requirements で定義された6テーブルを5テーブルに統合したことによる影響:

| 変更点 | 影響範囲 | 対応 |
|---|---|---|
| Users + UserTokens → Users テーブル | Terraform モジュール、Lambda IAM ポリシー | SK パターンで分離（PROFILE / TOKEN#provider） |
| NotificationSettings → AppData テーブル | Unit 5 の通知設定 Lambda | SK = "NOTIFICATION" で識別 |
| SakenowaCache → 独立テーブル維持 | CM-02 SakenowaClient、BE-09 SakenowaSync | グローバルデータ（PK: dataType）のため独立。PITR 無効（キャッシュのため復元不要） |
| テーブル数 6→5 | requirements.md §7、application-design.md | Infrastructure Design で同期更新 |

⚠️ Infrastructure Design Plan に以下の同期ステップを含めること:
- `inception/requirements/requirements.md` データモデルのテーブル数を 6→5 に更新、SakenowaCache の PITR 無効を明記
- `inception/application-design/application-design.md` §2 バックエンドの DynamoDB テーブル列挙を 5テーブル（Users, TasteProfiles, DrinkingLogs, SakenowaCache, AppData）に更新
- `inception/application-design/components.md` CM-02 SakenowaClient の記述で「DynamoDBキャッシュ = SakenowaCache テーブル」と明示
- `inception/requirements/requirements.md` §7 トレーサビリティの DynamoDB テーブル数を 5 に更新
- `inception/application-design/application-design.md` Lambda 数を 30 に更新（cognito-daily-backup 追加分）
- `inception/requirements/requirements.md` §7 トレーサビリティの Lambda 数を 30 に更新
