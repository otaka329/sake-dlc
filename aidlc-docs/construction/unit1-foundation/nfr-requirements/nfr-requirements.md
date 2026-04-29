# Unit 1: Foundation — NFR要件定義

---

## 1. パフォーマンス要件

### FE パフォーマンス
| 指標 | 目標値 | 計測方法 |
|---|---|---|
| 初期ロードサイズ | 200KB 以下（gzip後） | Vite ビルド出力 + Lighthouse |
| LCP (Largest Contentful Paint) | 2秒以内 | Lighthouse / Web Vitals |
| INP (Interaction to Next Paint) | 200ms 以内（"Good" 閾値） | Web Vitals |
| CLS (Cumulative Layout Shift) | 0.1 以下 | Web Vitals |
| TTI (Time to Interactive) | 3秒以内 | Lighthouse |

### 最適化戦略
- コード分割: React.lazy + Suspense による Feature 単位の遅延ロード
- ツリーシェイキング: Vite のデフォルト最適化
- 画像最適化: WebP フォーマット、適切なサイズ指定
- フォント最適化: サブセット化、font-display: swap
- Service Worker: 静的アセットの事前キャッシュ（Workbox precache）

### BE パフォーマンス
| 指標 | 目標値 | 備考 |
|---|---|---|
| API応答時間（認証系） | 500ms 以内 | Cognito SDK 呼び出し含む |
| API応答時間（プロファイル CRUD） | 200ms 以内 | DynamoDB 直接アクセス |
| Lambda コールドスタート | 3秒以内 | Node.js ランタイム |

### コールドスタート対策
- Lambda バンドルサイズの最小化（esbuild による tree-shaking）
- 共通依存の Lambda Layer 化
- Lambda SnapStart（Node.js 対応、re:Invent 2024 前後に GA。正確な GA 日付は Infrastructure Design ステージで AWS 公式ドキュメントにて再確認）を全 Lambda に適用（無料、コールドスタート短縮）
- Provisioned Concurrency: 初期は不採用（MAU 100-500 ではサインアップ頻度が1日数件レベルのため常時課金が非効率）。サインアップ急増時のみ cognito-pre-signup-trigger に適用を検討

---

## 2. スケーラビリティ要件

### 想定規模
| 指標 | 初期値 | 備考 |
|---|---|---|
| MAU | 100〜500人 | ハッカソンデモ＋α |
| DAU | 30〜150人 | MAU の 30% 想定 |
| ピーク同時接続 | 50人 | 夜間（19:00-23:00）に集中 |
| API呼び出し/日 | 5,000〜25,000 | DAU × 平均30リクエスト/セッション |

### スケーリング方針
- Lambda: 同時実行数上限 100（初期）。CloudWatch アラームで監視
- DynamoDB: オンデマンドキャパシティ（小規模のためプロビジョンド不要）
- CloudFront: デフォルト設定（自動スケーリング）
- API Gateway: 2層スロットリング構成
  - ステージレベル（全体）: 500 req/sec、バースト 1000
  - ユーザーレベル: 100 req/sec（Cognito sub による Lambda Authorizer 内チェック。詳細は NFR Design で設計）

---

## 3. 可用性要件

| 指標 | 目標値 | 備考 |
|---|---|---|
| 可用性 | 99.9%（月間ダウンタイム 43分以内） | AWS マネージドサービスの SLA に依存 |
| RTO | 1時間 | Terraform による再構築 |

### RPO（リソース別）
| 対象 | RPO | 復元方式 |
|---|---|---|
| DynamoDB | 5分以内 | Point-in-Time Recovery（35日間） |
| Cognito User Pool | 24時間（手動エクスポート） | バックアップ Lambda（日次） |
| S3 | 即時（バージョニング） | バージョン復元 |

### 障害対応
- DynamoDB: ポイントインタイムリカバリ有効化（35日間）
- S3: バージョニング有効化
- CloudFront: Edge キャッシュ + S3 リージョン可用性（99.99%）で確保。Multi-region フェイルオーバーは将来要件
- Cognito: 日次バックアップ Lambda（ユーザー属性エクスポート → S3）。`cognito-daily-backup`（EventBridge スケジュールトリガー）として Infrastructure Design で Lambda 関数一覧に追加予定（Lambda 総数 29→30）
  - ⚠️ Infrastructure Design Plan に以下の同期ステップを含めること:
    - `inception/application-design/components.md` BE-01 に `cognito-daily-backup` Lambda 追加
    - `inception/application-design/application-design.md` Lambda 数を 30 に更新
    - `inception/requirements/requirements.md` §7 トレーサビリティの Lambda 数を 30 に更新
- Lambda: デッドレターキュー（SQS）設定

---

## 4. セキュリティ要件（SECURITY-01〜15 準拠）

### 認証・セッション管理
| 項目 | 設定値 | SECURITY ルール |
|---|---|---|
| アクセストークン有効期限 | 1時間 | SECURITY-12 |
| リフレッシュトークン有効期限 | 30日 | SECURITY-12 |
| MFA | TOTP（Optional） | SECURITY-12 |
| パスワードポリシー | NIST SP 800-63B §3.1.1 準拠（15文字最小） | SECURITY-12 |
| ブルートフォース保護 | Cognito Advanced Security + API Gateway スロットリング | SECURITY-12 |
| セッション無効化 | ログアウト時 globalSignOut | SECURITY-12 |

### 暗号化
| 項目 | 方式 | SECURITY ルール |
|---|---|---|
| DynamoDB 暗号化（保存時） | AWS managed key (aws/dynamodb) | SECURITY-01 |
| S3 暗号化（保存時） | SSE-S3 (AES-256) | SECURITY-01 |
| 通信暗号化 | TLS 1.2+ 必須（CloudFront, API Gateway） | SECURITY-01 |
| mfaSecret 暗号化 | Cognito 内部管理 | SECURITY-01 |
| リカバリーコード保存 | HMAC-SHA-256（鍵は KMS 管理）。リカバリーコードは64ビット以上のランダム値で十分なエントロピーがあるため、適応型ハッシュ（bcrypt）は不要 | SECURITY-12 |
| Google OAuth トークン | KMS 暗号化（Unit 5 で実装） | SECURITY-01 |

### ログ・監視
| 項目 | 設定値 | SECURITY ルール |
|---|---|---|
| CloudWatch Logs 保持期間 | 180日 | SECURITY-14 (≥90日) |
| 構造化ログ形式 | JSON（timestamp, requestId, level, message） | SECURITY-03 |
| PII ログ除外 | パスワード、トークン、メールアドレスをマスク | SECURITY-03 |
| アクセスログ | API Gateway 実行ログ + アクセスログ有効化 | SECURITY-02 |
| CloudFront ログ | 標準ログ有効化 | SECURITY-02 |
| セキュリティアラート | Cognito Advanced Security（Adaptive Authentication）で認証異常を検出。独自 CloudWatch Alarm は Advanced Security でカバーされない指標に特化: 5xx エラー率、Lambda エラー率、DynamoDB スロットル | SECURITY-14 |

### HTTP セキュリティヘッダー（SECURITY-04）
| ヘッダー | 値 |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.amazonaws.com https://*.auth.*.amazoncognito.com` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |

### 入力バリデーション（SECURITY-05）
- 全APIエンドポイントで Zod スキーマバリデーション
- リクエストボディサイズ上限: API Gateway で 10MB（画像アップロード対応）
- 文字列最大長: ニックネーム 20文字、メモ 500文字

### アクセス制御（SECURITY-06, SECURITY-08）
- Cognito JWT Authorizer による認証必須（公開エンドポイントなし）
- Lambda IAM ロール: 最小権限（DynamoDB テーブル単位、アクション単位）
- CORS: 環境変数で指定（dev: `https://dev.sake-driven.example.com`、prod: `https://sake-driven.example.com`）。ワイルドカード（`*`）禁止（SECURITY-08）

### エラーハンドリング（SECURITY-09, SECURITY-15）
- 本番エラーレスポンス: 汎用メッセージのみ（スタックトレース非公開）
- グローバルエラーハンドラー: Lambda ハンドラーラッパーで実装
- Fail-closed: エラー時はアクセス拒否（認可バイパスなし）

---

## 5. PWA 要件（NFR-06）

| 項目 | 要件 |
|---|---|
| Service Worker | Workbox による事前キャッシュ + ランタイムキャッシュ |
| キャッシュ戦略（静的） | Cache-first（JS, CSS, 画像, フォント） |
| キャッシュ戦略（API） | Network-first（フォールバック: キャッシュ） |
| オフラインページ | カスタムオフラインフォールバックページ |
| バックグラウンド同期 | Background Sync API（書き込みキュー） |
| Web App Manifest | name, short_name, icons (192x192, 512x512), start_url, display: standalone, theme_color |
| プッシュ通知 | Web Push VAPID（Unit 5 で本実装） |

---

## 6. 多言語要件（NFR-05）

| 項目 | 要件 |
|---|---|
| ライブラリ | react-i18next |
| 対応言語 | ja（デフォルト）, en |
| 翻訳ファイル形式 | JSON（namespace 分割: common, auth, plan, build 等） |
| 言語検出 | ブラウザ Accept-Language → localStorage → ユーザー設定 |
| 日付・数値フォーマット | Intl API（ロケール対応） |

---

## 7. アクセシビリティ要件（NFR-07）

WCAG 2.1 AA 準拠を目標とする。

| 項目 | 要件 |
|---|---|
| セマンティックHTML | header, nav, main, section, article, footer |
| キーボードナビゲーション | 全インタラクティブ要素にフォーカス可能、Tab順序の論理性 |
| ARIA属性 | ランドマーク、ライブリージョン、フォームラベル |
| カラーコントラスト | WCAG 2.1 AA 基準（4.5:1 以上） |
| フォーカスインジケーター | 視認可能なフォーカスリング |
| スクリーンリーダー | aria-label, aria-describedby の適切な使用 |

---

## 8. テスト要件（NFR-08 + PBT-01〜10）

### テストフレームワーク
| ツール | 用途 |
|---|---|
| Vitest | ユニットテスト・統合テスト |
| fast-check | プロパティベーステスト（PBT） |
| Testing Library | React コンポーネントテスト |
| Playwright | E2E テスト（将来） |

### PBT 対象（Unit 1 スコープ）
| 対象 | プロパティカテゴリ | PBT ルール |
|---|---|---|
| パスワードバリデーション | Invariant（15文字以上で合格、14文字以下で不合格） | PBT-03 |
| ニックネームバリデーション | Invariant（2-20文字、許可文字のみ） | PBT-03 |
| メールバリデーション | Invariant（RFC 5322 準拠で合格） | PBT-03 |
| 言語切替 | Round-trip（ja→en→ja で元に戻る） | PBT-02 |
| JWT トークンパース | Round-trip（エンコード→デコード = 元データ） | PBT-02 |
| TasteProfile 初期化 | Invariant（全6軸が 0.5） | PBT-03 |

### テストカバレッジ目標
| 種別 | 目標 |
|---|---|
| ステートメントカバレッジ | 80% 以上 |
| ブランチカバレッジ | 70% 以上 |
| ビジネスルール（BR-01〜BR-06） | 100%（例示ベース + PBT） |

※ BR-01-07（ブロックリスト照合）は HaveIBeenPwned API のモック（msw）を使用した統合テストでカバー。外部API依存のため PBT 対象外とし、例示ベーステストで漏洩パスワード検出・辞書語検出・コンテキスト固有検出の各パスを検証する。

---

## 9. AIコスト戦略（NFR-01B）— Unit 1 スコープ

Unit 1 では CM-01 AIGateway のインターフェース定義＋スタブのみ。コスト戦略の詳細（モデル選定マトリクス、コスト試算、コスト制御戦略）は Unit 2 NFR Requirements で実施。

ただし、インターフェース段階で以下のコスト計装フックを盛り込む：

### IF に含めるコスト計装フック
| フック | 型 | 目的 |
|---|---|---|
| `input_tokens` | number (レスポンス) | 呼び出しごとの入力トークン数を CloudWatch カスタムメトリクスに送出 |
| `output_tokens` | number (レスポンス) | 呼び出しごとの出力トークン数を CloudWatch カスタムメトリクスに送出 |
| `model_id` | string (リクエスト/レスポンス) | 使用モデルの識別子（コスト集計の軸） |
| `cache_key` | string (リクエスト、optional) | レスポンスキャッシュ用のキー。実装は Unit 2 だが IF に引数として含める |
| `latency_ms` | number (レスポンス) | Bedrock API 呼び出しのレイテンシ（パフォーマンス監視） |

### CloudWatch カスタムメトリクス（Unit 1 で名前空間定義）
- Namespace: `SDLC/AIGateway`
- Dimensions: `ModelId`, `TemplateId`, `UseCaseType`
- Metrics: `InputTokens`, `OutputTokens`, `InvocationCount`, `LatencyMs`, `CacheHitRate`（Unit 2 で実装）
