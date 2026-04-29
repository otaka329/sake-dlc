# SDLC — コンポーネントメソッド定義

※ 詳細なビジネスルールはFunctional Design（CONSTRUCTION Phase）で定義

---

## CM-01: AIGateway

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `invokeModel(templateId, variables, options?)` | テンプレートID, 変数マップ, オプション(vision等) | AIレスポンス(テキスト) | プロンプトテンプレートを読み込み、変数を置換してBedrock Claudeを呼び出す |
| `invokeVisionModel(templateId, variables, imageBase64)` | テンプレートID, 変数マップ, 画像Base64 | AIレスポンス(テキスト) | 画像付きでBedrock Claude Visionを呼び出す |
| `getTemplate(templateId)` | テンプレートID | プロンプトテンプレート文字列 | S3からプロンプトテンプレートを取得（キャッシュ付き） |

---

## CM-02: SakenowaClient

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `getAreas()` | なし | Area[] | 地域一覧を取得（キャッシュ優先） |
| `getBrands()` | なし | Brand[] | 銘柄一覧を取得（キャッシュ優先） |
| `getBreweries()` | なし | Brewery[] | 蔵元一覧を取得（キャッシュ優先） |
| `getRankings()` | なし | Rankings | ランキングを取得（キャッシュ優先） |
| `getFlavorCharts()` | なし | FlavorChart[] | フレーバーチャートを取得（キャッシュ優先） |
| `getFlavorTags()` | なし | FlavorTag[] | フレーバータグ一覧を取得（キャッシュ優先） |
| `getBrandFlavorTags()` | なし | BrandFlavorTag[] | 銘柄別フレーバータグを取得（キャッシュ優先） |
| `refreshCache(dataType)` | データ種別 | void | 指定データのキャッシュを強制更新 |

---

## BE-02: RecommendationHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleRecommend(event)` | 料理, 気分, 体調, 予定 | 推薦結果(銘柄, 温度, 量, 器, 理由)[] | AI推薦を実行し3〜5件の結果を返す |
| `handleDontDeploy(event)` | 体調スコア, 服薬, 睡眠, 翌日予定 | 判定結果(deploy/skip), 理由, 代替提案[] | Don't Deploy Today判定を実行 |
| `handleMetaResponse(event)` | ユーザーメッセージ | AI応答テキスト | メタ的な質問への思慮深い応答を生成 |

---

## BE-03: PairingHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleTextPairing(event)` | 料理名テキスト | ペアリング結果(銘柄, 温度帯, 燗温度℃, 理由)[] | テキスト入力からペアリング提案 |
| `handleImagePairing(event)` | 画像Base64 | 認識料理名, ペアリング結果[] | 画像からVisionで料理認識→ペアリング提案 |

---

## BE-04: DrinkingLogHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleCreateLog(event)` | userId, brandId, temperature, amount, vessel, rating, isSkipDeploy, notes | DrinkingLog | 飲酒/非飲酒記録を作成し、TasteProfile更新をトリガー |
| `handleGetLogs(event)` | userId, dateRange?, limit? | DrinkingLog[] | 飲酒履歴を取得（ページネーション対応） |
| `handleMorningLog(event)` | userId, conditionScore, sleepQuality, scheduleImpact | MorningLog | 翌朝の状態を記録し前日の記録と紐付け |

---

## BE-05: TasteGraphHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleGetProfile(event)` | userId | TasteProfile(6軸スコア) | 味覚プロファイルを取得 |
| `handleDiscover(event)` | userId | 推薦銘柄(未体験)[] | 嗜好プロファイルに近い未体験銘柄を提案 |

---

## BE-06: DiscoveryHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleGetAreas(event)` | locale | Area[] | 地域一覧を返す |
| `handleGetBreweries(event)` | areaId?, locale | Brewery[] | 蔵元一覧を返す（地域フィルタ可） |
| `handleGetBrands(event)` | breweryId?, locale | Brand[] | 銘柄一覧を返す（蔵元フィルタ可） |
| `handleGetBrandDetail(event)` | brandId, locale | BrandDetail(フレーバーチャート, タグ含む) | 銘柄詳細を返す |
| `handleGetLearningContent(event)` | topic, locale | AIコンテンツ(テキスト) | AI生成の学習コンテンツを返す |

---

## BE-07: CalendarHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleGetEvents(event)` | userId | CalendarEvent(title, startTime)[] | Google Calendarから翌日の予定を取得 |
| `handleOAuthCallback(event)` | authCode | tokens | Google OAuth認証コールバック処理 |

---

## BE-08: NotificationHandlers

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleRegisterDevice(event)` | userId, pushSubscription | void | Web Push サブスクリプション（endpoint, keys）をDynamoDBに登録 |
| `handleUpdateSettings(event)` | userId, notificationSettings | void | 通知設定を更新 |
| `handleSendNotification(event)` | userId, title, body | void | EventBridgeトリガーでWeb Push Protocol経由の通知送信 |

---

## BE-09: SakenowaSync

| メソッド | 入力 | 出力 | 概要 |
|---|---|---|---|
| `handleSync(event)` | なし（EventBridgeトリガー or TTL切れ時） | void | さけのわ全エンドポイントからデータ取得しDynamoDBキャッシュ更新 |
