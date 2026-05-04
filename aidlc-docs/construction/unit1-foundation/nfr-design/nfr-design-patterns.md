# Unit 1: Foundation — NFR設計パターン

---

## 1. レジリエンスパターン

### 1.1 Lambda リトライ・フォールバック

| パターン | 適用箇所 | 設計 |
|---|---|---|
| タイムアウト付きリトライ | BL-08 HaveIBeenPwned API 呼び出し | タイムアウト 2秒。失敗時はチェックをスキップ（可用性優先、Fail-open の例外ケース。根拠: ブロックリスト照合は防御層の1つであり、他の照合（辞書・コンテキスト）で補完） |
| DLQ（Dead Letter Queue） | 全非同期 Lambda | SQS DLQ。最大リトライ 2回 → DLQ 送信。CloudWatch アラームで DLQ 深度監視 |
| グレースフルデグラデーション | Cognito 日次バックアップ Lambda | 失敗時は CloudWatch アラーム発火 + 次回スケジュールで再試行。手動復旧手順をドキュメント化 |

#### HaveIBeenPwned Fail-open トレードオフ（SECURITY-15 例外）

SECURITY-15 は「Fail-closed: エラー時はアクセス拒否」を原則とするが、HaveIBeenPwned API タイムアウト時は意図的に Fail-open とする。以下はそのトレードオフ分析:

| 観点 | Fail-closed（API失敗時にサインアップ拒否） | Fail-open（API失敗時にチェックをスキップ）★採用 |
|---|---|---|
| 可用性 | 外部API障害でサインアップ全停止 | サインアップ継続可能 |
| セキュリティ | 漏洩パスワードを100%ブロック | 一時的に漏洩パスワードが通過する可能性 |
| 補完防御 | — | カスタム辞書チェック + コンテキスト固有チェックが引き続き有効 |
| ユーザー体験 | 外部障害でユーザーが登録不能 | 透過的に継続 |
| 監査 | — | タイムアウト発生を Logger.warn() で記録 + Metrics: HibpTimeoutCount を送出 |
| リスク受容 | 低（完全ブロック） | 中（一時的な漏洩パスワード通過。ただし MFA 有効化推奨で緩和） |

採用理由: 外部 API の可用性に自サービスのサインアップ可用性を依存させない。タイムアウト発生時は CloudWatch メトリクス `HibpTimeoutCount` でアラーム監視し、頻発時は運用対応（API エンドポイント確認、フォールバックリスト検討）を行う。

### 1.2 フロントエンド リトライ戦略（ky）

```
API 呼び出しフロー:

  ky リクエスト
       |
       v
  +------------------+
  | ky retry (2回)   |
  | 指数バックオフ    |
  | 対象: 408, 5xx   |
  +------------------+
       |
       | 401 の場合
       v
  +------------------+
  | トークンリフレッシュ |
  | (Cognito SDK)    |
  +------------------+
       |
       | 成功 --> リクエストリトライ
       | 失敗 --> ログアウト + /login へリダイレクト
       v
  +------------------+
  | エラーハンドリング |
  | (ErrorBoundary)  |
  +------------------+
```

| 設定項目 | 値 | 根拠 |
|---|---|---|
| リトライ回数 | 2 | 過度なリトライによるレート制限回避 |
| リトライ対象 | 408, 500, 502, 503, 504 | 一時的エラーのみ。4xx（401除く）はリトライ不要 |
| バックオフ | 指数バックオフ（300ms, 600ms） | サーバー負荷軽減 |
| タイムアウト | 10秒 | LCP 2秒目標を考慮しつつ、Cognito SDK 呼び出しの余裕を確保 |

### 1.3 オフラインレジリエンス（PWA）

| パターン | 設計 |
|---|---|
| Cache-first（静的アセット） | Workbox precache: JS, CSS, フォント, アイコン。ビルド時にマニフェスト生成 |
| Network-first（API） | Workbox NetworkFirst: タイムアウト 3秒 → キャッシュフォールバック |
| Cache-first + TTL（さけのわデータ） | Workbox CacheFirst: maxAgeSeconds 86400（24h）。ExpirationPlugin で古いエントリ自動削除 |
| バックグラウンド同期 | Workbox BackgroundSync: オフライン時の書き込みを IndexedDB キューに保存。オンライン復帰時に自動送信 |
| Stale-While-Revalidate（プロファイル） | キャッシュを即時返却 + バックグラウンドで最新データ取得・キャッシュ更新 |

---

## 2. セキュリティパターン

### 2.1 Lambda ミドルウェアスタック（AWS Powertools）

全 Lambda ハンドラーに適用する共通ミドルウェアスタック:

```
リクエスト受信
     |
     v
+---------------------------+
| Powertools Logger         |  <-- SECURITY-03: 構造化ログ
| (correlationId 自動付与)  |      PII マスク設定
+---------------------------+
     |
     v
+---------------------------+
| Powertools Tracer         |  <-- X-Ray トレーシング
| (captureAWSv3Client)      |
+---------------------------+
     |
     v
+---------------------------+
| Powertools Metrics        |  <-- カスタムメトリクス送出
| (SDLC/Foundation)         |
+---------------------------+
     |
     v
+---------------------------+
| JWT 検証                  |  <-- SECURITY-08: トークン検証
| (Cognito Authorizer 後の  |      userId 抽出
|  追加検証)                |
+---------------------------+
     |
     v
+---------------------------+
| RateLimiter               |  <-- SECURITY-11: レート制限
| DynamoDB アトミック演算   |      100 req/min per user
| (ADD + ConditionExpr)     |
+---------------------------+
     |
     v
+---------------------------+
| Zod 入力バリデーション    |  <-- SECURITY-05: 入力検証
| (リクエストボディ/パス    |
|  パラメータ/クエリ)       |
+---------------------------+
     |
     v
+---------------------------+
| ビジネスロジック          |
+---------------------------+
     |
     v
+---------------------------+
| グローバルエラーハンドラー |  <-- SECURITY-09, 15: Fail-closed
| (エラー種別判定 →         |      汎用メッセージ返却
|  構造化エラーレスポンス)  |
+---------------------------+
```

### 2.2 エラーレスポンス形式（カスタム JSON）

```json
{
  "code": "VALIDATION_ERROR",
  "message": "入力内容に問題があります",
  "details": [
    {
      "field": "nickname",
      "reason": "2〜20文字で入力してください"
    }
  ]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| code | string | エラーコード（enum: VALIDATION_ERROR, AUTH_ERROR, NOT_FOUND, FORBIDDEN, RATE_LIMITED, INTERNAL_ERROR） |
| message | string | ユーザー向けメッセージ（多言語対応、i18n キー参照可） |
| details | array? | バリデーションエラー時のフィールド別詳細（本番でもフィールド名は返却。スタックトレースは非公開） |

### エラーコードマッピング

| HTTP Status | code | 用途 |
|---|---|---|
| 400 | VALIDATION_ERROR | Zod バリデーション失敗 |
| 401 | AUTH_ERROR | トークン無効・期限切れ |
| 403 | FORBIDDEN | リソースへのアクセス権なし（IDOR 防止） |
| 404 | NOT_FOUND | リソース不存在 |
| 429 | RATE_LIMITED | スロットリング |
| 500 | INTERNAL_ERROR | 予期しないエラー（詳細はログのみ） |

### API Gateway Gateway Response（エラー形式統一）

Lambda 内の ErrorHandler はカスタム JSON 形式を返却するが、API Gateway 自体が返すエラー（Cognito Authorizer 失敗、ペイロード超過、ステージレベルスロットリング、Integration Timeout）はデフォルト形式 `{"message":"..."}` になる。

これを統一するため、Terraform で `aws_api_gateway_gateway_response` を全エラータイプに定義:

| Gateway Response Type | HTTP Status | code | message |
|---|---|---|---|
| UNAUTHORIZED | 401 | AUTH_ERROR | 認証が必要です |
| ACCESS_DENIED | 403 | FORBIDDEN | アクセスが拒否されました |
| REQUEST_TOO_LARGE | 413 | VALIDATION_ERROR | リクエストサイズが上限を超えています |
| THROTTLED | 429 | RATE_LIMITED | リクエスト数が上限を超えています |
| INTEGRATION_TIMEOUT | 504 | INTERNAL_ERROR | サーバーが応答しませんでした |
| DEFAULT_4XX | 4xx | AUTH_ERROR | リクエストエラー |
| DEFAULT_5XX | 5xx | INTERNAL_ERROR | サーバーエラー |

レスポンステンプレート（全タイプ共通パターン）:

```json
{
  "code": "$context.error.responseType",
  "message": "$context.error.message"
}
```

Terraform 設定パターン:

```hcl
resource "aws_api_gateway_gateway_response" "throttled" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "THROTTLED"
  status_code   = "429"

  response_templates = {
    "application/json" = jsonencode({
      code    = "RATE_LIMITED"
      message = "リクエスト数が上限を超えています"
    })
  }

  response_parameters = {
    "gatewayresponse.header.Content-Type"                = "'application/json'"
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}
```

⚠️ Gateway Response の `response_parameters` で CORS ヘッダーも付与すること（エラー時に CORS ヘッダーが欠落するとブラウザがレスポンスを読めない）。

### 2.3 認証・認可フロー設計

```
クライアント
     |
     | Authorization: Bearer {accessToken}
     v
+---------------------------+
| API Gateway               |
| Cognito JWT Authorizer    |  <-- 署名・有効期限・aud・iss 検証
+---------------------------+
     |
     | event.requestContext.authorizer.claims
     v
+---------------------------+
| Lambda ハンドラー         |
| userId = claims.sub       |  <-- SECURITY-08: オブジェクトレベル認可
| リソース所有者チェック    |      userId === resource.userId
+---------------------------+
```

### オブジェクトレベル認可パターン（IDOR 防止）

全リソースアクセスで以下を強制:

```typescript
// パターン: リソース取得時の所有者チェック
const resource = await getResource(resourceId);
if (resource.userId !== requestUserId) {
  throw new ForbiddenError(); // 403 返却（リソース存在の漏洩防止のため 404 も検討）
}
```

### 2.4 CORS 設計

CORS は API Gateway 側で集約管理する。Lambda には CORS 責務を持たせない（二重管理による設定不整合を防止）。

| 設定箇所 | 責務 |
|---|---|
| API Gateway | CORS ヘッダーの付与（正常レスポンス + Gateway Response エラー） |
| Lambda | CORS ヘッダーを付与しない（API Gateway に委譲） |

| 環境 | Origin | 設定方法 |
|---|---|---|
| dev | `https://dev.sake-driven.example.com` | API Gateway ステージ変数 `allowed_origin` |
| prod | `https://sake-driven.example.com` | 同上 |

API Gateway での CORS 設定:
- 各リソースに `OPTIONS` メソッド（Mock Integration）を定義
- `method.response.header.Access-Control-Allow-Origin`: ステージ変数 `${stageVariables.allowed_origin}` から取得
- `method.response.header.Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
- `method.response.header.Access-Control-Allow-Headers`: `Content-Type, Authorization`
- `method.response.header.Access-Control-Max-Age`: `86400`（プリフライトキャッシュ 24h）
- Gateway Response（§2.2）の `response_parameters` でもエラー時に同じ CORS ヘッダーを付与
- ワイルドカード（`*`）禁止（SECURITY-08 準拠）

---

## 3. パフォーマンスパターン

### 3.1 フロントエンドバンドル最適化

200KB（gzip後）目標を達成するための分割戦略:

```
初期ロード（Critical Path）:
+------------------------------------------+
| vendor-react.js    (~45KB gzip)          |
| vendor-router.js   (~12KB gzip)          |
| app-shell.js       (~8KB gzip)           |
|   AppShell, TabBar, ProtectedRoute       |
|   ErrorBoundary, LoadingSpinner          |
| auth-feature.js    (~15KB gzip)          |
|   LoginPage, SignupPage, AuthContext     |
+------------------------------------------+
合計: ~80KB gzip（目標 200KB 以内）

※ gzip サイズ概算は bundlephobia.com の公開サイズ情報に基づく参考値（react-dom ~45KB, react-router ~12KB, ky ~3.5KB 等）。実測は `vite build --report` + `source-map-explorer` で Code Generation ステージにて検証予定。

遅延ロード（Feature 単位）:
+------------------------------------------+
| onboarding.js      (~5KB gzip)           |
| settings.js        (~8KB gzip)           |
| mfa-setup.js       (~10KB gzip)          |
|   QRコード生成ライブラリ含む             |
| i18n-[locale].js   (~3KB gzip per lang)  |
| plan.js            (Unit 2 で実装)       |
| build.js           (Unit 3 で実装)       |
| ...                                      |
+------------------------------------------+
```

| 最適化手法 | 設定 |
|---|---|
| コード分割 | React.lazy + Suspense（Feature 単位） |
| ツリーシェイキング | Vite デフォルト（ESM） |
| 依存最適化 | AWS SDK v3 モジュラーインポート（ky は ~3.5KB gzip で軽量） |
| 画像最適化 | WebP、width/height 明示、loading="lazy" |
| フォント最適化 | サブセット化、font-display: swap、preload |
| CSS | CSS Modules or Tailwind（PurgeCSS）— Code Generation で決定 |

### 3.2 Lambda コールドスタート対策

| 対策 | 適用 | 効果 |
|---|---|---|
| esbuild バンドル | 全 Lambda | Tree-shaking でバンドルサイズ最小化 |
| AWS SDK v3 モジュラーインポート | 全 Lambda | 必要なクライアントのみインポート |
| Lambda Layer | 共通依存（Powertools, Zod, pino） | 関数コード本体の軽量化 |
| Lambda SnapStart | 全 Lambda（Node.js GA 後） | コールドスタート短縮（無料） |
| 接続の再利用 | DynamoDB DocumentClient | `keepAlive: true`（Node.js デフォルト） |

### 3.3 DynamoDB アクセスパターン最適化

ハイブリッドテーブル設計:

| テーブル | エンティティ | 根拠 |
|---|---|---|
| Users | User, UserTokens | 認証・プロファイル操作で頻繁に同時アクセス。userId をパーティションキーとして共有。SK = `TOKEN#{provider}` は Unit 5 用のスキーマ予約（Unit 1 ではスキーマ定義のみ） |
| TasteProfiles | TasteProfile | 独立した読み書きパターン。AI 推論（Unit 2）で高頻度アクセス |
| DrinkingLogs | DrinkingLog | 時系列データ。userId + timestamp の複合キー。独立スケーリング |
| SakenowaCache | さけのわAPIキャッシュ | グローバルデータ（全ユーザー共通）。PK: dataType でユーザー非依存。TTL 24h で自動期限切れ。FR-01, FR-03, FR-04 が依存 |
| AppData | NotificationSettings, その他設定系 | 低頻度アクセスの設定データをグループ化 |

```
テーブル統合前（6テーブル）:
  Users, UserTokens, TasteProfiles,
  DrinkingLogs, SakenowaCache, NotificationSettings

テーブル統合後（5テーブル）:
  Users          : User + UserTokens
  TasteProfiles  : TasteProfile
  DrinkingLogs   : DrinkingLog
  SakenowaCache  : さけのわAPIキャッシュ（独立維持）
  AppData        : NotificationSettings + 設定系
```

SakenowaCache を独立テーブルとして維持する理由:
- グローバルデータ（PK: dataType）であり、AppData（PK: userId）とキースキーマが根本的に異なる
- 全ユーザー共通のキャッシュであり、ユーザー単位のテーブルに混在させると設計が複雑化
- TTL による自動期限切れが独立テーブルのほうがシンプルに管理可能
- CM-02 SakenowaClient が直接アクセスするため、独立テーブルのほうが IAM 権限分離が明確

| テーブル | PK | SK | GSI |
|---|---|---|---|
| Users | `userId` | `PROFILE` / `TOKEN#{provider}` | GSI1: `email` → `userId`（ソーシャルログイン紐付け用） |
| TasteProfiles | `userId` | — | — |
| DrinkingLogs | `userId` | `LOG#{timestamp}` | GSI1: `sakeId` → `userId, timestamp`（銘柄別検索） |
| SakenowaCache | `dataType` | — | — |
| AppData | `userId` | `NOTIFICATION` / `SETTING#{key}` | — |

---

## 4. スケーラビリティパターン

### 4.1 API Gateway スロットリング（2層構成）

```
クライアント
     |
     v
+----------------------------------+
| API Gateway ステージレベル       |
| 500 req/sec, バースト 1000      |  <-- 全体保護
+----------------------------------+
     |
     v
+----------------------------------+
| Cognito JWT Authorizer           |
| (認証のみ、レート制限なし)      |  <-- キャッシュ可能
+----------------------------------+
     |
     v
+----------------------------------+
| Lambda ハンドラー                |
| Powertools ミドルウェアスタック  |
|   -> RateLimiter ミドルウェア   |  <-- ユーザーレベル制限
|   -> Zod バリデーション         |
|   -> ビジネスロジック           |
+----------------------------------+
```

### ユーザーレベルレート制限の設計

レート制限は Lambda Authorizer ではなくハンドラー内のミドルウェア層で実行する。

理由:
- API Gateway Authorizer はレスポンスを最大1時間キャッシュする。レート制限ウィンドウ（60秒）より長いキャッシュは制限をバイパスしてしまう
- キャッシュ TTL を60秒未満にすると、毎リクエストで Authorizer Lambda が起動し、API 応答時間 200ms 目標を圧迫する
- ミドルウェア層であれば Authorizer キャッシュと独立して動作し、正確なカウントが可能

| 項目 | 設計 |
|---|---|
| 識別子 | Cognito JWT の `sub` クレーム（Authorizer から伝播） |
| アルゴリズム | スライディングウィンドウカウンター |
| ストレージ | DynamoDB（AppData テーブル、SK: `RATELIMIT#{window}`） |
| ウィンドウ | 60秒 |
| 上限 | 100 リクエスト/分 |
| 超過時レスポンス | 429 Too Many Requests + `Retry-After` ヘッダー |
| TTL | DynamoDB TTL でウィンドウ期限切れエントリを自動削除 |

### DynamoDB アトミック演算

カウンター更新は `UpdateItem` の `ADD` 演算 + `ConditionExpression` でアトミックに実行。同時リクエストでのカウンタ衝突を防止:

```
UpdateItem:
  Key: { PK: userId, SK: "RATELIMIT#{windowId}" }
  UpdateExpression: "ADD requestCount :inc SET #ttl = if_not_exists(#ttl, :ttlVal)"
  ConditionExpression: "attribute_not_exists(requestCount) OR requestCount < :limit"
  ExpressionAttributeValues:
    :inc = 1
    :limit = 100
    :ttlVal = <current_epoch + 120>  (ウィンドウ + バッファ)
```

- `ADD` 演算はアトミック増分（同時実行でも正確にカウント）
- `ConditionExpression` で上限チェックと増分を1回の操作で実行
- 条件不成立時は `ConditionalCheckFailedException` → 429 返却
- TTL は `if_not_exists` で初回のみ設定（既存エントリの TTL を上書きしない）

### 4.2 DynamoDB スケーリング

| 設定 | 値 | 根拠 |
|---|---|---|
| キャパシティモード | オンデマンド | MAU 100-500 の小規模。プロビジョンドは過剰 |
| ポイントインタイムリカバリ | 有効（35日間）※SakenowaCache は無効 | RPO 5分以内。SakenowaCache はキャッシュデータのため復元不要 |
| 暗号化 | AWS managed key | SECURITY-01 準拠 |
| TTL | 有効（レート制限エントリ、セッションデータ、SakenowaCache 24h） | 不要データの自動削除 |

---

## 5. 可観測性パターン

### 5.1 構造化ログ設計（Powertools Logger）

```json
{
  "level": "INFO",
  "message": "ユーザー登録完了",
  "timestamp": "2026-04-29T10:00:00.000Z",
  "service": "auth-handler",
  "xray_trace_id": "1-abc-def",
  "correlation_id": "req-12345",
  "cold_start": false,
  "function_name": "signup-handler",
  "function_memory_size": 256,
  "userId": "usr-xxx",
  "action": "signup",
  "duration_ms": 150
}
```

| 設定 | 値 | 根拠 |
|---|---|---|
| ログレベル（dev） | DEBUG | 開発時の詳細ログ |
| ログレベル（prod） | INFO | 本番は INFO 以上 |
| PII マスク | email → `***@domain`, password → `[REDACTED]` | SECURITY-03 |
| correlationId | API Gateway requestId を伝播 | リクエスト追跡 |

### 5.2 メトリクス設計（Powertools Metrics）

| Namespace | メトリクス | Dimensions | 用途 |
|---|---|---|---|
| SDLC/Foundation | SignupCount | authProvider | 登録数監視 |
| SDLC/Foundation | LoginCount | authProvider, mfaUsed | ログイン数監視 |
| SDLC/Foundation | AuthFailureCount | reason (invalid_password, mfa_failed, blocked_password) | セキュリティ監視 |
| SDLC/Foundation | ApiLatency | endpoint, method | パフォーマンス監視 |
| SDLC/Foundation | ValidationErrorCount | endpoint, field | 入力品質監視 |
| SDLC/Foundation | HibpTimeoutCount | reason (timeout, network_error) | HaveIBeenPwned Fail-open 監視（SECURITY-12 補完） |
| SDLC/AIGateway | InputTokens, OutputTokens, LatencyMs | ModelId, TemplateId | AI コスト監視（Unit 1 は IF 定義のみ） |

### 5.3 アラーム設計

| アラーム | 条件 | CloudWatch メトリクス | アクション | SECURITY ルール |
|---|---|---|---|---|
| 5xx エラー率 | > 5%（5分間） | `AWS/ApiGateway` `5XXError` | SNS → メール通知 | SECURITY-14 |
| Lambda エラー率 | > 10%（5分間） | `AWS/Lambda` `Errors` | SNS → メール通知 | SECURITY-14 |
| DynamoDB スロットル | > 0（5分間） | `AWS/DynamoDB` `ThrottledRequests` | SNS → メール通知 | SECURITY-14 |
| DLQ メッセージ数 | > 0 | `AWS/SQS` `ApproximateNumberOfMessagesVisible` | SNS → メール通知 | SECURITY-15 |
| HibpTimeout 頻発 | > 5（5分間） | `SDLC/Foundation` `HibpTimeoutCount` | SNS → メール通知 | SECURITY-12 |
| Cognito Advanced Security | リスクレベル High | Cognito Advanced Security（マネージド） | Cognito 自動ブロック | SECURITY-14 |

### 5.4 X-Ray トレーシング

| 設定 | 値 |
|---|---|
| API Gateway | トレーシング有効化 |
| Lambda | Powertools Tracer（`captureAWSv3Client` で SDK 呼び出しを自動トレース） |
| サンプリングレート | 5%（本番）、100%（dev） |

---

## 6. CloudFront セキュリティヘッダー設計

### Response Headers Policy（SECURITY-04 準拠）

CloudFront Response Headers Policy を使用（Lambda@Edge 不要）:

| ヘッダー | 値 | 設定方法 |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.amazonaws.com https://*.auth.*.amazoncognito.com` | カスタムヘッダー |

⚠️ `style-src 'unsafe-inline'` の根拠と移行計画:
- 現時点で CSS フレームワーク未決定（Code Generation で Tailwind / CSS Modules を選定予定）
- React の一部ライブラリ（react-i18next の動的スタイル、Recharts/Chart.js の SVG インラインスタイル）が `unsafe-inline` を必要とする可能性がある
- Code Generation ステージで CSS フレームワーク確定後、以下を検討:
  - CSS Modules 採用の場合: `unsafe-inline` を除去可能（ビルド時に CSS ファイル化）
  - インラインスタイルが不可避な依存がある場合: nonce ベース CSP（`style-src 'nonce-{random}'`）に切り替え。CloudFront Functions で nonce を動的生成
- 本番リリース前に `unsafe-inline` を除去または nonce 化することを目標とする
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | セキュリティヘッダー設定 |
| X-Content-Type-Options | `nosniff` | セキュリティヘッダー設定 |
| X-Frame-Options | `DENY` | セキュリティヘッダー設定 |
| Referrer-Policy | `strict-origin-when-cross-origin` | セキュリティヘッダー設定 |

### Terraform 設定パターン

```hcl
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "sdlc-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    content_type_options {
      override = true
    }
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

---

## 7. テスト可能プロパティ（PBT-01 準拠）

NFR 設計パターンから特定されたテスト可能プロパティ:

> **注記**: NFR Requirements（`nfr-requirements.md` §8）で特定済みの PBT 対象（パスワードバリデーション、ニックネームバリデーション、メールバリデーション、言語切替、JWT トークンパース、TasteProfile 初期化）は機能側（ビジネスルール）のプロパティ。本セクションは基盤側（ミドルウェア・インフラパターン）のプロパティを補完的に特定したもの。両者は重複なく、機能側＋基盤側で Unit 1 の PBT カバレッジを構成する。

| 対象 | プロパティカテゴリ | プロパティ | PBT ルール |
|---|---|---|---|
| エラーレスポンス生成 | Invariant | 全エラーレスポンスが `{ code, message }` 構造を持つ | PBT-03 |
| Zod バリデーション | Round-trip | Zod スキーマで parse → serialize → parse が等価 | PBT-02 |
| レート制限カウンター | Invariant | カウント値は常に 0 以上かつ上限以下 | PBT-03 |
| レート制限カウンター | Idempotence | 同一ウィンドウ内の重複チェックは結果不変 | PBT-04 |
| PII マスク | Invariant | マスク後の出力に email/password の平文が含まれない | PBT-03 |
| DynamoDB キー生成 | Round-trip | PK/SK からエンティティ種別とIDを復元可能 | PBT-02 |
| 開示レイヤー更新 | Invariant | disclosureLevel は単調増加（1→2→3 のみ、逆行不可） | PBT-03 |
| 2軸マッピング | Invariant | 6軸入力 [0,1] に対して2軸出力が常に [0,1] 範囲内 | PBT-03 |
