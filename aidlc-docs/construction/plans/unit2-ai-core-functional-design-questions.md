# Unit 2: AI Core — Functional Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
AI 推薦の出力構造について、推薦1件あたりの情報粒度はどの程度にしますか？

A) 最小限（銘柄名 + 推奨温度 + 適量 + 1行理由）
B) 標準（銘柄名 + 推奨温度 + 適量 + 推奨器 + 理由2〜3文 + さけのわフレーバースコア）
C) 詳細（標準 + 料理との相性解説 + 代替銘柄 + 購入しやすさ情報）
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
Don't Deploy Today の判定ロジックについて、AI（Bedrock）への依存度はどの程度にしますか？

A) ルールベース主体 — 体調スコア・服薬・睡眠の閾値で機械的に判定。AI は理由文の生成のみ
B) AI 主体 — 全入力をプロンプトに渡し、AI が総合判定（Deploy/Skip Deploy）を返す
C) ハイブリッド — ルールベースで明確なケース（服薬あり等）は即 Skip Deploy。グレーゾーンのみ AI 判定
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 3
Bedrock モデルの選定について、Unit 2 スコープ（推薦・判定・メタ応答）ではどのモデルバリアントを使用しますか？

A) Claude 3.5 Sonnet 一本 — 高品質・コスト中程度。全ユースケースで統一
B) ユースケース別使い分け — 推薦: Sonnet、判定: Haiku（軽量・低コスト）、メタ応答: Haiku
C) Claude 3 Haiku 一本 — 低コスト・高速。品質は若干劣るが MAU 100-500 では許容
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
プロンプトテンプレートの管理方式について、どのアプローチを採用しますか？

A) S3 保存 + Lambda 起動時にフェッチ — ランタイムで最新テンプレートを取得。デプロイなしで更新可能
B) コード内定数 — TypeScript ファイルにテンプレート文字列を定義。バージョン管理容易
C) DynamoDB 保存 — テンプレートID でルックアップ。管理画面で編集可能（将来）
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5
Plan 画面の入力 UI について、体調・予定・料理の入力をどのようなフローで提供しますか？

A) ワンページフォーム — 体調・予定・料理を1画面にまとめて入力。スクロールで一覧
B) ステップバイステップ — 体調 → 予定 → 料理 の3ステップに分割。各ステップで「次へ」
C) カード式 — 各入力項目をカードとして表示。任意の順序で入力可能。未入力でもスキップ可
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 6
推薦結果の表示と Layer（Progressive Disclosure）の連携について、Layer 1（感覚モード）での推薦結果はどのように表示しますか？

A) 感覚的キャッチフレーズのみ — 「フルーティーで軽やか、今夜の魚介にぴったり」。銘柄名は表示するが技術情報なし
B) 感覚的表現 + 2軸位置 — 上記 + 甘辛×濃淡マッピングのビジュアル表示
C) 銘柄カード形式 — 銘柄名 + 温度（冷やして/常温で/温めて の表現）+ 適量 + 感覚的理由。Layer 2+ で詳細が展開
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
料理入力のサジェスト機能（US-06 補足条件）について、どのデータソースを使用しますか？

A) 静的リスト — 代表的な料理カテゴリ（刺身、焼き魚、煮物、揚げ物 等）をハードコード
B) ユーザー履歴ベース — 過去に入力した料理名をサジェスト（個人の履歴から）
C) ハイブリッド — 静的カテゴリ + 直近入力履歴。Unit 2 では静的リストのみ、履歴は Unit 4 で追加
D) Other (please describe after [Answer]: tag below)

[Answer]: C

