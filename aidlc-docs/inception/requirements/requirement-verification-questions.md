# SDLC — Sake Driven Life Cycle 要件確認質問

ピッチデッキの内容を分析しました。以下の質問にお答えください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

---

## Question 1
今回のハッカソンで実装するスコープはどこまでですか？

A) コア機能6つすべてを実装する（Sake Recommendation Engine, Don't Deploy Today, Pairing Lab, Sake Discovery, Next-Day Optimizer, Personal Taste Graph）
B) デモシナリオの4つのやりとり（Deploy / Skip Deploy / Pairing / Meta）が動く最小限のプロトタイプ
C) 1〜2機能に絞ったMVP（例：Sake Recommendation Engine + Don't Deploy Today のみ）
D) フロントエンドのモックアップ＋1つのAI機能のみ
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
フロントエンドの技術スタックについて、ピッチではReact / PWAとありますが、具体的な希望はありますか？

A) React + TypeScript（Vite）— PWA対応あり
B) React + TypeScript（Next.js）— PWA対応あり
C) React + TypeScript（Vite）— PWA対応なし（まずWebアプリとして）
D) React + TypeScript（Next.js）— PWA対応なし
X) Other (please describe after [Answer]: tag below)

[Answer]: X — React + TypeScript で Vite / Next.js はどちらでもよい

---

## Question 3
バックエンドのアーキテクチャについて、ピッチではAPI Gateway + Lambdaとありますが、どのように進めますか？

A) ピッチ通りAWS（API Gateway + Lambda + DynamoDB + Bedrock）でサーバーレス構成
B) ローカルで動くバックエンド（Node.js/Express等）＋ Bedrock API呼び出し
C) フロントエンドから直接Bedrock APIを呼ぶシンプル構成
D) バックエンドはモック/スタブで、フロントエンドとAI推論のデモに集中
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
ユーザー認証は必要ですか？

A) はい — Cognito等を使った本格的な認証
B) はい — シンプルなログイン（メール＋パスワード程度）
C) いいえ — ハッカソンデモなので認証なし
D) ローカルストレージでユーザー識別する程度
X) Other (please describe after [Answer]: tag below)

[Answer]: X — 必須（具体的な方式は未指定）

---

## Question 5
日本酒データ（銘柄・蔵元・特徴等）はどのように用意しますか？

A) 既存のAPIやデータセットを利用する（sakenowa API等）
B) サンプルデータ（20〜50銘柄程度）をJSON/CSVで手動作成
C) AIに生成させたダミーデータを使用
D) データは最小限にして、AI推論のデモに集中
X) Other (please describe after [Answer]: tag below)

[Answer]: X — さけのわデータ（https://muro.sakenowa.com/sakenowa-data）よりAPI経由で取得。サイトに負荷がかからないように配慮すること。

---

## Question 6
Pairing Lab（料理写真からのペアリング提案）で画像入力は必須ですか？

A) はい — カメラ/画像アップロードでBedrock Visionを使う
B) テキスト入力（料理名の入力）のみでOK
C) 両方対応したい（画像＋テキスト）
D) Pairing Lab機能自体は今回スコープ外
X) Other (please describe after [Answer]: tag below)

[Answer]: X — 必要な画像があれば別途生成する。機能としては画像対応する方向。

---

## Question 7
多言語対応（インバウンド向け）は今回のスコープに含めますか？

A) はい — 日本語＋英語の2言語対応
B) はい — 日本語＋英語＋中国語の3言語対応
C) いいえ — 日本語のみ
D) UIは日本語だが、AI応答は多言語で返せるようにする
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
Personal Taste Graph（味覚のベクトル表現）の実装レベルはどの程度ですか？

A) DynamoDB + ベクトル検索を使った本格実装
B) シンプルなスコアリング（甘口/辛口/フルーティ等の軸でレーダーチャート表示）
C) 履歴の記録と表示のみ（ベクトル化は将来対応）
D) Taste Graph機能は今回スコープ外
X) Other (please describe after [Answer]: tag below)

[Answer]: X — 要検討

---

## Question 9
Next-Day Optimizer（カレンダー連携）の実装レベルはどの程度ですか？

A) Google Calendar API等と実際に連携
B) ユーザーが手動で翌日の予定を入力する形式
C) 時間帯ベースのシンプルなルール（例：22時以降は控えめに推奨）
D) Next-Day Optimizer機能は今回スコープ外
X) Other (please describe after [Answer]: tag below)

[Answer]: X — 要検討

---

## Question 10: セキュリティ拡張
このプロジェクトにセキュリティ拡張ルールを適用しますか？

A) はい — すべてのセキュリティルールをブロッキング制約として適用（本番グレードのアプリケーション向け推奨）
B) いいえ — セキュリティルールをスキップ（PoC、プロトタイプ、実験的プロジェクト向け）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11: プロパティベーステスト拡張
このプロジェクトにプロパティベーステスト（PBT）ルールを適用しますか？

A) はい — すべてのPBTルールをブロッキング制約として適用（ビジネスロジック、データ変換、シリアライゼーション、ステートフルコンポーネントを持つプロジェクト向け推奨）
B) 部分的 — 純粋関数とシリアライゼーションのラウンドトリップにのみPBTルールを適用
C) いいえ — PBTルールをスキップ（シンプルなCRUDアプリケーション、UIのみのプロジェクト向け）
X) Other (please describe after [Answer]: tag below)

[Answer]: A
