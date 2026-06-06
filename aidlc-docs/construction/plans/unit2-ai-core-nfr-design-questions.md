# Unit 2: AI Core — NFR Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
AI レスポンスの JSON 構造化パース方式について、Bedrock からの出力をどのように構造化データに変換しますか？

A) プロンプト内で JSON フォーマット指定 + Zod safeParse — AI に JSON 形式で出力させ、Zod でバリデーション
B) XML タグ付き出力 + カスタムパーサー — AI にXMLタグで構造化出力させ、タグベースで抽出
C) Bedrock の Tool Use（Function Calling）— 構造化出力を強制（Claude 3 対応）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 2
AIGateway のテスト・デバッグ支援について、開発時のプロンプト調整をどのようにサポートしますか？

A) ドライランモード — 実際の Bedrock 呼び出しをスキップし、テンプレート + 変数置換結果のみ返却。コスト $0 で確認可能
B) ログレベル制御 — DEV 環境のみ完全なプロンプト文字列と AI レスポンスをログ出力
C) 両方（ドライラン + 詳細ログ）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
推薦結果の matchScore 算出を AI 側で行うか、Lambda 側で行うかの分担について：

A) Lambda 側で算出 — AI は銘柄推薦のみ。matchScore は Lambda が TasteProfile × さけのわフレーバーから計算（BL-17 の設計通り）
B) AI 側で算出 — プロンプトに TasteProfile を含め、AI が matchScore も出力
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
Terraform Custom Resource（プロンプトシード投入）のライフサイクル管理について：

A) 作成時のみ投入（Create のみ）— 初回 apply でシード。以降のテンプレート更新は手動スクリプト or 管理画面
B) 作成 + 更新（Create + Update）— Terraform のテンプレート定義変更で自動更新。バージョン自動インクリメント
C) Other (please describe after [Answer]: tag below)

[Answer]: B

