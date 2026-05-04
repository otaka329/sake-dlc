# SDLC — コンポーネント定義

---

## フロントエンド コンポーネント（Feature-based構成）

### FE-01: AuthFeature（認証機能）
- **責務**: ユーザー登録、ログイン、ソーシャルログイン、MFA（TOTP）、セッション管理
- **インターフェース**: Cognito SDK連携、認証状態のContext提供
- **関連ストーリー**: US-01, US-02, US-02B, US-30

### FE-02: PlanFeature（計画機能）
- **責務**: 体調・予定入力、料理入力（テキスト/画像）、SDLCサイクルのPlanステップUI
- **インターフェース**: Plan APIへのリクエスト送信、画像アップロード
- **関連ストーリー**: US-04, US-05, US-06, US-07

### FE-03: BuildFeature（構成機能）
- **責務**: AI推薦結果の表示、Don't Deploy Today判定表示、ノンアル代替提案、カスタマイズUI
- **インターフェース**: Recommendation API / Don't Deploy API呼び出し
- **関連ストーリー**: US-08, US-09, US-10, US-11

### FE-04: TestFeature（ペアリング機能）
- **責務**: Pairing Lab UI（テキスト/画像入力）、ペアリング結果表示
- **インターフェース**: Pairing API呼び出し、画像アップロード
- **関連ストーリー**: US-12, US-13

### FE-05: DeployFeature（実行機能）
- **責務**: Deploy/Skip Deploy記録UI、メタ応答表示
- **インターフェース**: DrinkingLog API呼び出し
- **関連ストーリー**: US-14, US-15, US-16

### FE-06: MonitorFeature（観測機能）
- **責務**: 翌朝の状態記録UI、飲酒終了通知設定
- **インターフェース**: Monitor API呼び出し、プッシュ通知登録
- **関連ストーリー**: US-17, US-18

### FE-07: OptimizeFeature（最適化機能）
- **責務**: Taste Graphレーダーチャート表示、履歴一覧、新銘柄発見UI
- **インターフェース**: TasteGraph API / History API呼び出し
- **関連ストーリー**: US-19, US-20, US-21

### FE-08: DiscoveryFeature（発見機能）
- **責務**: 地域別酒蔵ブラウジング、銘柄詳細表示、学習コンテンツ
- **インターフェース**: Discovery API呼び出し
- **関連ストーリー**: US-22, US-23, US-24

### FE-09: SharedComponents（共通コンポーネント）
- **責務**: レイアウト、ナビゲーション、i18n切替、通知設定UI、PWA関連、開示レイヤー管理（DisclosureContext、レイヤー判定ロジック、解放通知UI）
- **インターフェース**: 全Feature から利用される共通UI部品
- **関連ストーリー**: US-03, US-25, US-26, US-28, US-29
- **注記**: US-27（プッシュ通知設定）の設定UIはFE-09が提供するが、ストーリー所有はUnit 5（BE-08 NotificationHandlers）。FE-09は設定画面のUI部品のみ担当

---

## バックエンド コンポーネント（Lambda関数群 — エンドポイント単位）

### BE-01: AuthHandlers（認証ハンドラー群）
- **責務**: Cognito連携のユーザー管理、MFA管理、NIST準拠パスワードポリシー
- **Lambda関数**:
  - `cognito-pre-signup-trigger` — Cognito Pre Sign-up Lambda Trigger。パスワードのブロックリスト照合（HaveIBeenPwned Passwords API k-anonymity + カスタム辞書）。NIST SP 800-63B §3.1.1.2 準拠
  - `post-signup` — サインアップ後処理（プロファイル初期化）
  - `get-profile` — ユーザープロファイル取得
  - `put-profile` — ユーザープロファイル更新
  - `post-mfa-setup` — MFA（TOTP）セットアップ開始
  - `post-mfa-verify` — MFA（TOTP）検証・有効化
  - `delete-mfa` — MFA無効化
  - `post-recovery-codes` — リカバリーコード発行
  - `put-disclosure-level` — 開示レイヤー更新（手動全解放、カテゴリ別解放）
  - `cognito-daily-backup` — Cognito ユーザー属性の日次バックアップ（EventBridge スケジュールトリガー → S3 エクスポート）

### Cognito × NIST SP 800-63B §3.1.1 整合性メモ
| NIST要件 | Cognito対応 | 実装方針 |
|---|---|---|
| 最小長15文字（単一要素） | Cognito PasswordPolicy MinimumLength=15 | Cognito設定で対応 ✅ |
| 最大長64文字以上 | Cognito上限256文字 | 制約なし ✅ |
| 文字種混合ルール禁止 | RequireUppercase等を個別OFF | Cognito設定で対応 ✅ |
| Unicode対応 | Cognito UTF-8対応 | 制約なし ✅ |
| ブロックリスト照合 | ネイティブ非対応 | Pre Sign-up Lambda Trigger で実装 ⚠️ |
| 定期変更禁止 | Cognito TemporaryPasswordValidityDays のみ | アプリ側で強制変更UIを作らない ✅ |
| パスワードマネージャー許可 | フロントエンド側の制御 | autocomplete属性を適切に設定 ✅ |

### BE-02: RecommendationHandlers（推薦ハンドラー群）
- **責務**: AI日本酒推薦、Don't Deploy Today判定
- **Lambda関数**:
  - `post-recommend` — 日本酒推薦リクエスト処理
  - `post-dont-deploy` — Don't Deploy Today判定
  - `post-meta-response` — メタ応答（「飲むべき？」等）

### BE-03: PairingHandlers（ペアリングハンドラー群）
- **責務**: 料理×日本酒ペアリング提案
- **Lambda関数**:
  - `post-pairing-text` — テキスト入力ペアリング
  - `post-pairing-image` — 画像入力ペアリング（Vision）

### BE-04: DrinkingLogHandlers（飲酒記録ハンドラー群）
- **責務**: Deploy/Skip Deploy記録の管理
- **Lambda関数**:
  - `post-drinking-log` — 飲酒記録の作成
  - `get-drinking-logs` — 飲酒履歴の取得
  - `post-morning-log` — 翌朝の状態記録

### BE-05: TasteGraphHandlers（味覚グラフハンドラー群）
- **責務**: 味覚プロファイルの管理と更新
- **Lambda関数**:
  - `get-taste-profile` — 味覚プロファイル取得
  - `post-discover` — 新銘柄発見（嗜好ベース推薦）

### BE-06: DiscoveryHandlers（発見ハンドラー群）
- **責務**: 酒蔵・銘柄情報の提供
- **Lambda関数**:
  - `get-areas` — 地域一覧
  - `get-breweries` — 蔵元一覧（地域フィルタ）
  - `get-brands` — 銘柄一覧（蔵元フィルタ）
  - `get-brand-detail` — 銘柄詳細（フレーバーチャート含む）
  - `get-learning-content` — 学習コンテンツ生成

### BE-07: CalendarHandlers（カレンダーハンドラー群）
- **責務**: Google Calendar連携
- **Lambda関数**:
  - `get-calendar-events` — 翌日の予定取得
  - `post-calendar-auth` — Google OAuth認証コールバック

### BE-08: NotificationHandlers（通知ハンドラー群）
- **責務**: Web Push プッシュ通知管理（VAPID）
- **Lambda関数**:
  - `post-register-device` — Web Push サブスクリプション登録（VAPID公開鍵配布、PushSubscription保存）
  - `put-notification-settings` — 通知設定更新
  - `send-notification` — EventBridgeトリガーで Web Push Protocol 経由の通知送信

### ⚠️ Pinpoint EoS 対応メモ
Amazon Pinpoint は 2025-05-20 以降新規顧客不可、2026-10-30 サポート終了（[出典](https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html)）。
代替として Web Push (VAPID) + Service Worker を採用。バックエンドから直接 Web Push Protocol で通知送信。
DynamoDB NotificationSettings テーブルに PushSubscription（endpoint, keys.p256dh, keys.auth）を保存。

### BE-09: SakenowaSync（さけのわデータ同期）
- **責務**: さけのわAPIからのデータ取得・キャッシュ管理
- **Lambda関数**:
  - `sync-sakenowa-data` — さけのわデータ取得・キャッシュ更新（TTL 24h）

---

## 共通コンポーネント

### CM-01: AIGateway（AI Gateway）
- **責務**: Bedrock Claude API呼び出しの一元管理、プロンプトテンプレート管理
- **機能**: プロンプトテンプレートのS3からの読み込み、変数置換、API呼び出し、レスポンス解析
- **利用元**: BE-02, BE-03, BE-05, BE-06

### CM-02: SakenowaClient（さけのわクライアント）
- **責務**: さけのわAPIへのアクセスとDynamoDBキャッシュ（SakenowaCache テーブル）の読み書き
- **機能**: TTLベースキャッシュ（24h）、キャッシュミス時のAPI呼び出し
- **利用元**: BE-02, BE-03, BE-05, BE-06

### CM-03: AuthMiddleware（認証ミドルウェア）
- **責務**: Cognito JWTトークンの検証、ユーザーID抽出
- **利用元**: 全BE-ハンドラー（認証必須エンドポイント）

### CM-04: Logger（ロガー）
- **責務**: 構造化ログ出力（CloudWatch Logs）
- **機能**: リクエストID、タイムスタンプ、ログレベル、メッセージ
- **利用元**: 全コンポーネント
