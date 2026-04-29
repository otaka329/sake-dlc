# Unit 1: Foundation — NFR Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
Lambda ハンドラーのミドルウェアパターンとして、どのアプローチを採用しますか？

A) middy（Lambda ミドルウェアフレームワーク）— プラグイン方式でバリデーション・ログ・エラーハンドリングを積み重ね
B) カスタムラッパー関数 — 自前の高階関数で共通処理をラップ（依存ゼロ）
C) AWS Powertools for TypeScript — ログ・トレーシング・メトリクスの統合ツールキット
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 2
API エラーレスポンスの構造化フォーマットとして、どの形式を採用しますか？

A) RFC 9457 Problem Details（`application/problem+json`）— 標準化されたエラーフォーマット
B) カスタム JSON 形式（`{ code, message, details }`）— シンプルで柔軟
C) AWS API Gateway デフォルトエラー形式をそのまま使用
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3
フロントエンドの API クライアント層で、リトライとエラーハンドリングをどのように実装しますか？

A) axios + axios-retry — インターセプターベースのリトライ・トークンリフレッシュ
B) ky（fetch ラッパー）— 軽量、リトライ内蔵、バンドルサイズ小
C) カスタム fetch ラッパー — 依存ゼロ、完全制御
D) TanStack Query（React Query）— サーバー状態管理 + 自動リトライ・キャッシュ
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
DynamoDB のシングルテーブル設計 vs マルチテーブル設計について、どちらを採用しますか？

A) シングルテーブル設計 — 全エンティティを1テーブルに集約（GSI でアクセスパターン対応）
B) マルチテーブル設計 — エンティティごとに独立テーブル（6テーブル、NFR Requirements で定義済み）
C) ハイブリッド — 関連性の高いエンティティはグループ化、独立性の高いものは分離
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5
CloudFront のセキュリティヘッダー設定方法として、どのアプローチを採用しますか？

A) CloudFront Response Headers Policy — マネージドポリシー + カスタムヘッダー（Lambda@Edge 不要）
B) Lambda@Edge（Origin Response）— 完全なカスタマイズ、動的ヘッダー対応
C) CloudFront Functions — 軽量、低レイテンシ、ヘッダー追加に最適
D) Other (please describe after [Answer]: tag below)

[Answer]: A

