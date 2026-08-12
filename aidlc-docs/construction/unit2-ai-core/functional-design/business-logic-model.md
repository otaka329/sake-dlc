# Unit 2: AI Core — ビジネスロジックモデル

---

## BL-11: AI 日本酒推薦フロー（POST /recommend）

```
入力: PlanInput（体調、予定、料理、気分）
認証: Cognito JWT から userId を抽出

1. ユーザーの TasteProfile を DynamoDB から取得
2. SakenowaClient からフレーバーチャート + ランキングデータを取得（キャッシュ優先）
3. ユーザーの disclosureLevel を Users テーブルから取得
4. プロンプトテンプレート「recommend」を DynamoDB から取得（最新バージョン）
5. テンプレート変数を置換:
   - {{dishes}}: 料理名リスト
   - {{mood}}: 気分
   - {{tasteProfile}}: 6軸スコア
   - {{flavorData}}: さけのわフレーバーデータ（**上位30銘柄に制限**。全銘柄を含めると入力トークンがコスト試算前提の2000を超過するため）
   - {{disclosureLevel}}: 開示レイヤー（出力フォーマット制御）
   - {{locale}}: ユーザー言語
6. AIGateway 経由で Bedrock Claude 3.5 Sonnet を呼び出し
7. AI レスポンスを構造化パース（Tool Use output → Zod バリデーション）
8. Lambda が各推薦銘柄の brandId で SakenowaCache から flavorScores を取得・付与（ハルシネーション防止）
9. ⚠️ matchScore は AI が算出済み（NFR Design で改訂。旧 BL-17 のユークリッド距離は廃止）
10. コスト計装メトリクス送出（input_tokens, output_tokens, latency_ms）
11. レスポンス返却（推薦結果 + 帰属表示）
```

---

## BL-12: Don't Deploy Today 判定フロー（POST /dont-deploy）

```
入力: PlanInput（体調、服薬、睡眠、翌日予定）
認証: Cognito JWT から userId を抽出

Phase 1: ルールベース判定（即確定）
1. isMedicated == true → Skip Deploy（理由: 服薬中）
2. conditionScore <= 2 → Skip Deploy（理由: 体調不良）
3. sleepHours <= 4 → Skip Deploy（理由: 睡眠不足）
4. tomorrowScheduleImportance >= 5 かつ tomorrowEarliestStart < "08:00"
   → Skip Deploy（理由: 翌朝の重要予定）

いずれかに該当 → ruleBased = true, decision = skip_deploy
   → ノンアル代替提案を AI (Haiku) で生成
   → レスポンス返却

Phase 2: AI 判定（グレーゾーン）
5. プロンプトテンプレート「dont-deploy」を DynamoDB から取得
6. テンプレート変数を置換:
   - {{conditionScore}}: 体調スコア
   - {{sleepHours}}: 睡眠時間
   - {{tomorrowSchedule}}: 翌日予定概要
   - {{mood}}: 気分
7. AIGateway 経由で Bedrock Claude 3 Haiku を呼び出し
8. AI レスポンスをパース（decision, confidence, reason）
9. decision == skip_deploy の場合:
   → ノンアル代替提案を AI (Haiku) で生成
10. コスト計装メトリクス送出
11. レスポンス返却
```

---

## BL-13: ノンアル代替提案生成フロー

```
入力: 季節情報、気分（PlanInput から）
呼び出し元: BL-12（Skip Deploy 判定時）

1. プロンプトテンプレート「alternative-proposal」を DynamoDB から取得
2. テンプレート変数を置換:
   - {{season}}: 現在の季節（月から判定）
   - {{mood}}: ユーザーの気分
   - {{locale}}: ユーザー言語
3. AIGateway 経由で Bedrock Claude 3 Haiku を呼び出し
4. AI レスポンスをパース（1〜3件の代替提案）
5. 結果返却
```

---

## BL-14: メタ応答フロー（POST /meta-response）

```
入力: { message: string }（ユーザーの判断委任的質問）
認証: Cognito JWT から userId を抽出

1. メッセージが判断委任パターンに該当するか判定:
   - パターン: 「飲むべき？」「今日いける？」「飲んでいい？」「大丈夫？」等
   - 正規表現 + キーワードマッチング
2. 該当しない場合 → 通常の推薦フローにリダイレクト（BL-11）

3. プロンプトテンプレート「meta-response」を DynamoDB から取得
4. テンプレート変数を置換:
   - {{userMessage}}: ユーザーの質問テキスト
   - {{locale}}: ユーザー言語
5. AIGateway 経由で Bedrock Claude 3 Haiku を呼び出し
6. AI レスポンスをパース（message, suggestedAction）
7. forceDeploy = false を付与（強制しない）
8. コスト計装メトリクス送出
9. レスポンス返却
```

---

## BL-15: AIGateway 本実装フロー（CM-01）

```
入力: AIGatewayRequest（templateId, input, cacheKey?, disclosureLevel?）

1. プロンプトテンプレートを DynamoDB から取得（templateId + 最新 version）
2. テンプレートの modelId を使用モデルとして決定（リクエスト引数ではなくテンプレート定義で一意化）
3. テンプレート変数を置換（input マップの値で {{key}} を置換）
4. 未置換プレースホルダーがないか検証（あればエラー: BR-13-05）
5. disclosureLevel に応じて出力フォーマット指示を追加:
   - Layer 1: 「技術用語を使わず、感覚的な表現のみで回答してください」
   - Layer 2: 「酒米・タイプ・産地を含めてください」
   - Layer 3: 「精米歩合・酵母・日本酒度も含めてください」
6. Bedrock InvokeModel API を呼び出し:
   - modelId: テンプレートの modelId（BR-13-01/02 でテンプレート作成時に設定）
   - body: プロンプト + maxTokens + temperature（テンプレートから取得）
   - タイムアウト: 10秒
7. レスポンスをパース
8. コスト計装データを構築:
   - inputTokens, outputTokens: Bedrock レスポンスの usage から取得
   - latencyMs: 呼び出し開始〜完了の差分
   - modelId: テンプレートの modelId
9. CloudWatch カスタムメトリクス送出（SDLC/AIGateway ネームスペース）
10. AIGatewayResponse を返却
```

---

## BL-16: プロンプトテンプレート取得フロー

```
入力: templateId (string)

1. DynamoDB AppData テーブルを Query:
   - PK: "SYSTEM"
   - SK: begins_with("PROMPT#{templateId}#v")
   - ScanIndexForward: false（降順）
   - Limit: 1（最新バージョン）
2. レコードが存在しない場合 → InternalError（Fail-closed: BR-14-04）
3. PromptTemplate オブジェクトを構築して返却
```

---

## BL-17: matchScore 算出ロジック

```
⚠️ NFR Design で改訂: matchScore は AI（Bedrock Tool Use）が算出する設計に変更。
本 BL-17 のユークリッド距離計算は廃止。
詳細: aidlc-docs/construction/unit2-ai-core/nfr-design/logical-components.md §5

flavorScores は Lambda 側で SakenowaCache から付与（ハルシネーション防止）。
matchScore のみ AI が算出（料理相性を含む総合判断、[0,1] 範囲は Zod で強制）。
```
