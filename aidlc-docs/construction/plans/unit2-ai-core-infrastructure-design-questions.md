# Unit 2: AI Core — Infrastructure Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
Bedrock のリージョン選択について、ap-northeast-1（東京）で Claude 3.5 Sonnet / Claude 3 Haiku の両方が利用可能ですが、レイテンシ優先でこのリージョンを使用しますか？

A) ap-northeast-1（東京）— レイテンシ最小。アプリケーション全体と同一リージョン
B) us-east-1（バージニア）— モデル可用性が最も高い。クロスリージョン呼び出しでレイテンシ増加
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
Unit 2 の Lambda 関数のメモリサイズについて、AI 推論のレスポンスパース（Tool Use JSON）とキャッシュ操作を考慮してどの程度を割り当てますか？

A) 256MB — Unit 1 と同じ。AI レスポンスのサイズは小さいため十分
B) 512MB — AI レスポンスパース + SakenowaCache データ処理を余裕を持って実行
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3
Terraform モジュール構成について、Unit 2 のリソースをどのように管理しますか？

A) 既存モジュールに追加 — lambda-base に IAM ロール追加、api-gateway にエンドポイント追加
B) 新規モジュール `ai-core` を作成 — Unit 2 固有リソース（Bedrock IAM、Lambda 3本、Custom Resource）を集約
C) Other (please describe after [Answer]: tag below)

[Answer]: A

