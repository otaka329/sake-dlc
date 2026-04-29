# SDLC — ストーリー生成計画

## 計画概要
SDLCの要件定義書（FR-01〜FR-08、NFR-01〜NFR-08）に基づき、ユーザーストーリーとペルソナを生成する。

---

## Part 1: 質問

以下の質問にお答えください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

### Question 1
ストーリーの分解アプローチはどれが良いですか？

A) ユーザージャーニーベース — SDLCサイクル（Plan→Build→Test→Deploy→Monitor→Optimize）に沿ってストーリーを構成
B) 機能ベース — 6コア機能（Recommendation, Don't Deploy, Pairing, Discovery, Next-Day, Taste Graph）ごとにストーリーを構成
C) ペルソナベース — ユーザータイプ（初心者、減酒志向、インバウンド、愛好家）ごとにストーリーを構成
D) ハイブリッド（ジャーニー＋機能） — SDLCサイクルを軸に、各ステップで関連機能のストーリーを展開
X) Other (please describe after [Answer]: tag below)

[Answer]: D

### Question 2
ストーリーの粒度はどの程度が良いですか？

A) 粗い粒度 — エピック単位（例：「日本酒推薦機能」で1ストーリー）。全体で10〜15ストーリー程度
B) 中程度の粒度 — 機能の主要フロー単位（例：「料理から銘柄を推薦する」「気分から銘柄を推薦する」）。全体で20〜30ストーリー程度
C) 細かい粒度 — 個別操作単位（例：「料理名をテキスト入力する」「推薦結果を表示する」）。全体で40〜60ストーリー程度
D) お任せ（プロジェクト規模に応じて最適な粒度を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
受け入れ基準のフォーマットはどれが良いですか？

A) Given-When-Then 形式（BDD スタイル）
B) チェックリスト形式（箇条書きの条件リスト）
C) 両方の併用（主要シナリオはGiven-When-Then、補足条件はチェックリスト）
D) お任せ（ストーリーの性質に応じて最適な形式を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 4
ペルソナの詳細度はどの程度が良いですか？

A) 詳細 — 名前、年齢、職業、ライフスタイル、日本酒との関係、技術リテラシー、利用シーン、ペインポイント、ゴールを含む
B) 中程度 — 名前、属性概要、主な利用シーン、ペインポイント、ゴール
C) 簡潔 — ユーザータイプ名、主な特徴、主要ゴールのみ
D) お任せ（推奨レベルを選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
「Don't Deploy Today」（飲まない日）のストーリーについて、どの程度の深さで扱いますか？

A) 深く掘り下げる — 飲まない判定ロジック、ノンアル代替提案、メンタルケア応答（「飲むべき？」への対応）をそれぞれ独立ストーリーに
B) 標準的 — 飲まない判定と代替提案を1つのストーリー群として扱う
C) 軽め — Deploy/Skip Deployの分岐として他機能のストーリーに統合
D) お任せ（コンセプトの重要度に応じて最適な深さを選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 6
ストーリーの優先度付けは必要ですか？

A) はい — MoSCoW法（Must/Should/Could/Won't）で優先度を付ける
B) はい — 数値スコア（1-5）で優先度を付ける
C) いいえ — 優先度は後のフェーズで決める
D) お任せ
X) Other (please describe after [Answer]: tag below)

[Answer]: A 

---

## Part 2: 生成計画（回答後に実行）

### ステップ一覧
- [x] Step 1: ペルソナ定義の生成（personas.md）
- [x] Step 2: ユーザーストーリーの生成（stories.md）
- [x] Step 3: ペルソナとストーリーのマッピング
- [x] Step 4: INVEST基準の検証
- [x] Step 5: 成果物の最終確認
