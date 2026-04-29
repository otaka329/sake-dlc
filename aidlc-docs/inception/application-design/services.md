# SDLC — サービス定義

---

## サービスアーキテクチャ概要

```
[React SPA] → [CloudFront] → [API Gateway] → [Lambda Functions]
                                                    ↓
                                    ┌───────────────┼───────────────┐
                                    ↓               ↓               ↓
                              [AIGateway]    [SakenowaClient]  [DynamoDB]
                                    ↓               ↓
                              [Bedrock]      [さけのわAPI]
                              [S3 Templates]
```

---

## SVC-01: RecommendationService（推薦サービス）

| 項目 | 内容 |
|---|---|
| 責務 | 日本酒推薦のオーケストレーション |
| 入力 | 料理情報、気分、体調、予定、ユーザー味覚プロファイル |
| 処理フロー | 1. SakenowaClientからフレーバーデータ取得 → 2. ユーザーTasteProfile取得 → 3. AIGatewayで推薦プロンプト実行 → 4. 結果を構造化して返却 |
| 利用コンポーネント | CM-01 (AIGateway), CM-02 (SakenowaClient), DynamoDB (TasteProfiles) |
| 関連ハンドラー | BE-02 (post-recommend) |

---

## SVC-02: DontDeployService（飲まない判定サービス）

| 項目 | 内容 |
|---|---|
| 責務 | Don't Deploy Today判定とノンアル代替提案 |
| 入力 | 体調スコア、服薬有無、睡眠時間、翌日予定 |
| 処理フロー | 1. 入力データの正規化 → 2. AIGatewayで判定プロンプト実行 → 3. Deploy/Skip Deploy判定結果と理由を返却 → 4. Skip時はノンアル代替提案も生成 |
| 利用コンポーネント | CM-01 (AIGateway) |
| 関連ハンドラー | BE-02 (post-dont-deploy, post-meta-response) |

---

## SVC-03: PairingService（ペアリングサービス）

| 項目 | 内容 |
|---|---|
| 責務 | 料理×日本酒ペアリングのオーケストレーション |
| 入力 | 料理名テキスト or 料理画像 |
| 処理フロー | (テキスト) 1. SakenowaClientからフレーバーデータ取得 → 2. AIGatewayでペアリングプロンプト実行 → 3. 結果返却 / (画像) 1. AIGateway(Vision)で料理認識 → 2. 認識結果でテキストフローと同様に処理 |
| 利用コンポーネント | CM-01 (AIGateway), CM-02 (SakenowaClient) |
| 関連ハンドラー | BE-03 (post-pairing-text, post-pairing-image) |

---

## SVC-04: DrinkingLogService（飲酒記録サービス）

| 項目 | 内容 |
|---|---|
| 責務 | 飲酒/非飲酒記録の管理とTasteProfile更新 |
| 入力 | 飲酒記録データ（銘柄、温度、量、評価等） |
| 処理フロー | 1. DrinkingLogをDynamoDBに保存 → 2. Deploy時: SakenowaClientから銘柄のフレーバーデータ取得 → 3. 評価に基づきTasteProfileの6軸スコアを加重平均で更新 |
| 利用コンポーネント | CM-02 (SakenowaClient), DynamoDB (DrinkingLogs, TasteProfiles) |
| 関連ハンドラー | BE-04 (post-drinking-log, get-drinking-logs, post-morning-log) |

---

## SVC-05: TasteGraphService（味覚グラフサービス）

| 項目 | 内容 |
|---|---|
| 責務 | 味覚プロファイル管理と嗜好ベース銘柄発見 |
| 入力 | ユーザーID |
| 処理フロー | (プロファイル取得) DynamoDBからTasteProfile読み込み / (発見) 1. TasteProfile取得 → 2. SakenowaClientからフレーバーチャート取得 → 3. 6軸ユークリッド距離で類似銘柄を算出 → 4. 飲酒済み銘柄を除外して返却 |
| 利用コンポーネント | CM-02 (SakenowaClient), DynamoDB (TasteProfiles, DrinkingLogs) |
| 関連ハンドラー | BE-05 (get-taste-profile, post-discover) |

---

## SVC-06: DiscoveryService（発見サービス）

| 項目 | 内容 |
|---|---|
| 責務 | 酒蔵・銘柄情報の提供と学習コンテンツ生成 |
| 入力 | 地域ID、蔵元ID、銘柄ID、トピック、ロケール |
| 処理フロー | (ブラウジング) SakenowaClientからデータ取得しロケールに応じて返却 / (学習) AIGatewayで学習コンテンツプロンプト実行 |
| 利用コンポーネント | CM-01 (AIGateway), CM-02 (SakenowaClient) |
| 関連ハンドラー | BE-06 |

---

## SVC-07: CalendarService（カレンダーサービス）

| 項目 | 内容 |
|---|---|
| 責務 | Google Calendar連携と飲酒終了時刻算出 |
| 入力 | ユーザーID、OAuth認証コード |
| 処理フロー | 1. Google Calendar APIで翌日予定取得 → 2. 最も早い予定の開始時刻から逆算して飲酒終了推奨時刻を算出 → 3. EventBridgeでリマインド通知をスケジュール |
| 利用コンポーネント | Google Calendar API, DynamoDB (UserTokens), EventBridge |
| 関連ハンドラー | BE-07, BE-08 |

---

## SVC-08: NotificationService（通知サービス）

| 項目 | 内容 |
|---|---|
| 責務 | Web Push プッシュ通知の管理と送信 |
| 入力 | PushSubscription、通知設定、通知内容 |
| 処理フロー | 1. Web Push サブスクリプション登録（VAPID公開鍵配布 → PushSubscription をDynamoDBに保存） → 2. EventBridgeトリガーで通知送信Lambda起動 → 3. Web Push Protocol（RFC 8030）経由で通知送信 → 4. ユーザー設定に基づきフィルタリング |
| 利用コンポーネント | web-push ライブラリ（Node.js）, EventBridge, DynamoDB (NotificationSettings) |
| 関連ハンドラー | BE-08 |
| 備考 | Amazon Pinpoint は 2026-10-30 EoS のため不採用。VAPID鍵ペアはSSM Parameter Storeに保存 |
