# Unit 2: AI Core — NFR Requirements 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
Bedrock AI 推論のレスポンスキャッシュ戦略について、どのアプローチを採用しますか？同一入力（料理 + TasteProfile）に対して同一推薦を返すことはユーザー体験上望ましいですか？

A) キャッシュなし — 毎回 AI に問い合わせ。常に新鮮な推薦。コスト高
B) 短期キャッシュ（1時間）— 同一ユーザー・同一入力の場合はキャッシュを返す。コスト削減 + 一貫性
C) ハイブリッド — Don't Deploy 判定はキャッシュなし（リアルタイム性重要）、推薦は入力ハッシュで短期キャッシュ
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 2
月次 AI 推論コスト上限について、MAU 100-500 の初期フェーズでの目安はどの程度を想定しますか？

A) 月額 $50 以下 — 厳格なコスト制御。推薦回数制限（例: 1日5回/ユーザー）を設ける
B) 月額 $100 以下 — 中程度。推薦回数は緩め（例: 1日10回）、キャッシュで最適化
C) 月額 $200 以下 — 品質優先。回数制限なし、キャッシュ + モデル使い分けで最適化
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
AI レスポンスの構造化パース失敗時のフォールバック戦略について、どのアプローチを採用しますか？

A) リトライ（最大2回）— 同一プロンプトで再試行。JSON フォーマット指示を強化して再送
B) デフォルトレスポンス — パース失敗時は「推薦を取得できませんでした」とエラーメッセージ返却
C) 緩いパース + デフォルト補完 — パースできたフィールドのみ使用、欠落フィールドはデフォルト値で補完
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
プロンプトテンプレートの初期シードデータ投入方法について、どのアプローチを採用しますか？

A) Terraform + Lambda（Custom Resource）— Terraform apply 時にシードデータを DynamoDB に投入
B) 手動スクリプト — デプロイ後に `scripts/seed-prompts.ts` を実行して投入
C) アプリ起動時チェック — Lambda 初回呼び出し時にテンプレート不存在なら自動生成（ハードコードフォールバック）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
AI 推薦の入力に含まれるユーザーデータ（体調、服薬、気分）のプロンプトへの送信について、プライバシー上どの方針を取りますか？

A) 全入力をそのまま送信 — Bedrock はデータ保持しない（AWS の責任共有モデル）ため問題なし
B) 匿名化して送信 — userId を含めず、体調スコア等の数値のみ送信
C) カテゴリ化して送信 — 体調「良い/普通/悪い」、服薬「あり/なし」に粗粒度化してから送信
D) Other (please describe after [Answer]: tag below)

[Answer]: A

