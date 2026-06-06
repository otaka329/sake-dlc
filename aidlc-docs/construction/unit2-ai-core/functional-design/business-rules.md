# Unit 2: AI Core — ビジネスルール

---

## BR-08: AI 日本酒推薦（US-08）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-08-01 | 推薦結果は3〜5件を返すこと | recommendations.length >= 3 && <= 5 |
| BR-08-02 | 各推薦に銘柄名、温度、適量、器、理由を含むこと | 全フィールド非 null |
| BR-08-03 | さけのわフレーバーチャートのデータを推薦根拠に使用すること | flavorScores が SakenowaCache から取得した値と一致 |
| BR-08-04 | ユーザーの TasteProfile（6軸）と銘柄のフレーバースコアの適合度を提示すること | matchScore は AI が算出（[0,1] 範囲を Zod で強制）。flavorScores は Lambda が SakenowaCache から付与（⚠️ NFR Design で改訂: 旧ユークリッド距離計算は廃止） |
| BR-08-05 | レスポンスは p95 で5秒以内であること。Bedrock API タイムアウトは 10秒（タイムアウト時はエラー返却） | p95 latency <= 5000ms。タイムアウト超過時は INTERNAL_ERROR |
| BR-08-06 | さけのわデータの帰属表示を含むこと | attribution に https://sakenowa.com へのリンクを含む |
| BR-08-07 | Layer に応じて出力フォーマットを切り替えること | disclosureLevel 1: 感覚的表現、2: カテゴリ情報追加、3: 専門情報追加 |
| BR-08-08 | ユーザーが既に飲んだ銘柄は推薦しないこと（可能な範囲で） | DrinkingLogs の brandId と重複しない |

---

## BR-09: Don't Deploy Today 判定（US-09）

### ルールベース判定（即確定ケース）

| ルールID | 条件 | 判定 | 根拠 |
|---|---|---|---|
| BR-09-01 | isMedicated == true | Skip Deploy | 服薬中は飲酒を避けるべき |
| BR-09-02 | conditionScore <= 2 | Skip Deploy | 体調不良時は飲酒を避けるべき |
| BR-09-03 | sleepHours <= 4 | Skip Deploy | 睡眠不足時は飲酒を避けるべき |
| BR-09-04 | tomorrowScheduleImportance >= 5 かつ tomorrowEarliestStart < "08:00" | Skip Deploy | 翌朝の重要予定に影響するリスク |

### AI 判定（グレーゾーン）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-09-05 | ルールベースで確定しない場合、AI（Bedrock Haiku）で総合判定すること | ruleBased == false の場合のみ AI 呼び出し |
| BR-09-06 | AI 判定結果は Deploy/Skip Deploy + 確信度 + 理由を返すこと | decision, confidence, reason が非 null |
| BR-09-07 | Skip Deploy 推奨でもユーザーが Deploy を選択可能であること | 強制しない。UI でオーバーライド可能 |
| BR-09-08 | Skip Deploy 時にノンアル代替提案を1〜3件返すこと | alternatives.length >= 1 && <= 3 |

---

## BR-10: ノンアル代替提案（US-10）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-10-01 | 季節や気分に応じた代替提案を行うこと | season フィールドを考慮 |
| BR-10-02 | 代替提案はノンアルコール飲料のみであること | アルコール含有の提案を含まない |
| BR-10-03 | 各提案に理由を付与すること | reason が非空 |

---

## BR-11: 推薦結果のカスタマイズ（US-11）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-11-01 | 温度帯を変更可能（冷酒/常温/ぬる燗/熱燗） | TemperatureRecommendation.type を上書き |
| BR-11-02 | 適量（ml）を変更可能 | amount を 30〜300ml の範囲で変更可 |
| BR-11-03 | カスタマイズ内容は Deploy 時の記録に反映されること | DrinkingLog に最終確定値を保存 |

---

## BR-12: メタ応答（US-16）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-12-01 | 判断委任的な質問（「飲むべき？」「今日いける？」等）を検出すること | テキスト解析で判断委任パターンを識別 |
| BR-12-02 | 思慮深い応答を返し、自律的判断を促すこと | message が説教的でなく共感的なトーン |
| BR-12-03 | 強制的に Skip Deploy にしないこと | forceDeploy == false |
| BR-12-04 | 白湯や休息などの代替アクションを提案すること | suggestedAction が非 null |

---

## BR-13: AIGateway コスト制御

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-13-01 | 推薦テンプレートの modelId は Claude 3.5 Sonnet を指定すること | PromptTemplate.modelId == "anthropic.claude-3-5-sonnet-*" |
| BR-13-02 | 判定・メタ応答テンプレートの modelId は Claude 3 Haiku を指定すること | PromptTemplate.modelId == "anthropic.claude-3-haiku-*" |
| BR-13-03 | 全 AI 呼び出しで input_tokens / output_tokens / latency_ms を計装すること | CloudWatch メトリクス送出 |
| BR-13-04 | プロンプトテンプレートのバージョン管理を行うこと | PromptTemplate.version が単調増加 |
| BR-13-05 | テンプレート変数の置換漏れがないこと | 未置換プレースホルダー（`{{...}}`）がプロンプトに残らない |
| BR-13-06 | モデル選定はテンプレートの modelId で一意に決定すること（リクエスト引数で上書きしない） | AIGatewayRequest に modelId フィールドなし |

---

## BR-14: プロンプトテンプレート管理

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-14-01 | テンプレートは DynamoDB AppData テーブルに保存すること | PK: SYSTEM, SK: PROMPT#{templateId}#v{version} |
| BR-14-02 | テンプレート取得時は最新バージョンを使用すること | version が最大のレコードを取得 |
| BR-14-03 | テンプレート変数はプレースホルダー形式 `{{variableName}}` で定義すること | templateBody 内に `{{...}}` パターン |
| BR-14-04 | テンプレート取得失敗時はエラーを返すこと（Fail-closed） | InternalError をスロー |

---

## BR-15: 料理サジェスト（US-06 補足）

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-15-01 | Unit 2 では静的カテゴリリストからサジェストすること | ハードコードリスト |
| BR-15-02 | カテゴリ: 刺身・寿司、焼き魚、煮物、揚げ物、肉料理、野菜料理、鍋物、デザート | 8カテゴリ |
| BR-15-03 | 各カテゴリに代表的な料理名を3〜5件含むこと | カテゴリ展開時に表示 |
| BR-15-04 | 日本語・英語の両方で提供すること | i18n 対応 |
