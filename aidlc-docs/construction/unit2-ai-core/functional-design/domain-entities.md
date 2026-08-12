# Unit 2: AI Core — ドメインエンティティ

---

## PlanInput（Plan 入力データ）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| userId | string (UUID) | Yes | ユーザーID |
| conditionScore | number (1-5) | No | 体調スコア（1: 悪い 〜 5: 良い） |
| isMedicated | boolean | No | 服薬有無 |
| sleepHours | number | No | 直近の睡眠時間 |
| tomorrowScheduleImportance | number (1-5) | No | 翌日予定の重要度（1: 低 〜 5: 高） |
| tomorrowEarliestStart | string (HH:mm) | No | 翌日の最も早い予定の開始時刻（例: "08:00"）。Google Calendar 連携 or 手動入力 |
| tomorrowScheduleSummary | string | No | 翌日予定の概要（Google Calendar 連携 or 手動入力） |
| dishes | DishInput[] | No | 料理入力（複数可） |
| mood | string | No | 気分（テキスト自由入力） |
| createdAt | ISO8601 string | Yes | 入力日時 |

---

## DishInput（料理入力）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| name | string | Yes | 料理名（テキスト入力 or 画像認識結果） |
| category | enum | No | 料理カテゴリ（sashimi, grilled_fish, simmered, fried, meat, vegetable, nabe, dessert, other） |
| source | enum (text, image) | Yes | 入力ソース |

---

## Recommendation（AI 推薦結果 1件）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| brandId | number | Yes | さけのわ銘柄 ID |
| brandName | string | Yes | 銘柄名 |
| temperature | TemperatureRecommendation | Yes | 推奨温度 |
| amount | number | Yes | 適量（ml） |
| vessel | string | Yes | 推奨器（猪口、ぐい呑み、ワイングラス 等） |
| reason | string | Yes | 推薦理由（2〜3文） |
| flavorScores | FlavorScores | nullable | さけのわフレーバースコア（6軸）。Lambda が SakenowaCache から付与。該当 brandId なしの場合 null（F4） |
| matchScore | number (0-1) | Yes | ユーザー嗜好との適合度 |

---

## TemperatureRecommendation（温度推薦）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| type | enum (reishu, jouon, nurukan, atsukan) | Yes | 温度帯 |
| celsius | number | Yes | 具体的な温度（℃） |
| label | string | Yes | 表示ラベル（「冷やして」「常温で」「ぬる燗で」「熱燗で」） |
| labelEn | string | Yes | 英語ラベル（"chilled", "room temp", "warm", "hot"） |

---

## FlavorScores（フレーバースコア）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| f1 | number (0-1) | Yes | 華やか |
| f2 | number (0-1) | Yes | 芳醇 |
| f3 | number (0-1) | Yes | 重厚 |
| f4 | number (0-1) | Yes | 穏やか |
| f5 | number (0-1) | Yes | ドライ |
| f6 | number (0-1) | Yes | 軽快 |

---

## RecommendationResponse（推薦レスポンス）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recommendations | Recommendation[] | Yes | 推薦結果リスト（3〜5件） |
| deployAdvice | DeployAdvice | No | Deploy/Skip Deploy 判定結果。/recommend では返さない（/dont-deploy が担当）。フロントは /dont-deploy の結果を PlanContext に保持して使用 |
| attribution | string | Yes | さけのわデータ帰属表示テキスト + URL |

---

## DeployAdvice（Deploy 判定結果）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| decision | enum (deploy, skip_deploy) | Yes | 判定結果 |
| confidence | number (0-1) | Yes | 判定確信度 |
| reason | string | Yes | 判定理由（ユーザー向けテキスト） |
| ruleBased | boolean | Yes | ルールベースで確定したか（true: 服薬あり等、false: AI 判定） |
| alternatives | AlternativeProposal[] | No | ノンアル代替提案（Skip Deploy 時のみ） |

---

## AlternativeProposal（ノンアル代替提案）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| name | string | Yes | 代替ドリンク名（甘酒ソーダ、ノンアル日本酒 等） |
| reason | string | Yes | 提案理由 |
| season | string | No | 季節性（春、夏 等） |

---

## MetaResponse（メタ応答）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| message | string | Yes | 思慮深い応答テキスト |
| suggestedAction | enum (pause, hydrate, reflect) | Yes | 提案アクション |
| forceDeploy | boolean | Yes | 常に false（強制しない） |

---

## PromptTemplate（プロンプトテンプレート）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| templateId | string | Yes | テンプレートID（PK） |
| version | number | Yes | バージョン番号 |
| modelId | string | Yes | 対象 Bedrock モデル ID |
| templateBody | string | Yes | プロンプトテンプレート本文（変数プレースホルダー含む） |
| variables | string[] | Yes | テンプレート変数名リスト |
| maxTokens | number | Yes | 最大出力トークン数 |
| temperature | number | Yes | Bedrock Temperature パラメータ |
| createdAt | ISO8601 string | Yes | 作成日時 |
| updatedAt | ISO8601 string | Yes | 更新日時 |

---

## DynamoDB 保存先

| エンティティ | テーブル | PK | SK |
|---|---|---|---|
| PromptTemplate | AppData | `SYSTEM` | `PROMPT#{templateId}#v{version}` |
| PlanInput | （Unit 4 DrinkingLogs で記録） | — | — |

---

## スコープ境界注記

| 項目 | Unit 2 の責務 | 他ユニット依存 |
|---|---|---|
| US-09「飲まない日も Taste Graph に記録」 | DeployAdvice を返却するまで | 記録は Unit 4 (DrinkingLogService) が担当 |
| US-10「代替提案も味覚グラフに記録可能」 | AlternativeProposal を返却するまで | 記録は Unit 4 が担当 |
| BR-11-03「カスタマイズ内容は Deploy 時の記録に反映」 | カスタマイズ UI を提供するまで | DrinkingLog 保存は Unit 4 が担当 |
| DishInput.source: image | 前方互換フィールド。Unit 2 の DishCard はテキスト + サジェストのみ | 画像入力（US-07）は Unit 3 (PairingHandlers) で実装 |
| Google Calendar 連携 | tomorrowEarliestStart の手動入力 UI を提供 | 自動入力は Unit 5 (CalendarHandlers) で実装 |
