# Unit 1: Foundation — Infrastructure Design 質問

以下の質問に回答してください。各質問の `[Answer]:` タグの後に選択肢の記号を記入してください。
該当する選択肢がない場合は、最後の選択肢（Other）を選び、説明を記入してください。

---

## Question 1
Terraform の状態管理バックエンドとして、どの方式を採用しますか？

A) S3 + DynamoDB（ロック）— AWS ネイティブ、最も一般的
B) Terraform Cloud — リモート実行、チーム協業向け
C) ローカルバックエンド — 個人開発、シンプル
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
環境分離の方式として、どのアプローチを採用しますか？

A) Terraform ワークスペース — 同一コードベースで dev/prod を切り替え
B) ディレクトリ分離 — environments/dev/, environments/prod/ で完全分離
C) ブランチ戦略 — main=prod, develop=dev で分離
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3
カスタムドメインの利用について、どの方針ですか？

A) 初期からカスタムドメイン（Route 53 + ACM 証明書）— sake-driven.example.com
B) 初期は CloudFront / API Gateway のデフォルトドメインで運用し、後からカスタムドメインを追加
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
CI/CD パイプラインのツール選定について、どの方針ですか？

A) GitHub Actions — GitHub リポジトリとの統合、ワークフロー定義
B) AWS CodePipeline + CodeBuild — AWS ネイティブ、IAM 統合
C) 手動デプロイ（初期）— スクリプトベースで Terraform apply + フロントエンドビルド・デプロイ
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
Cognito の Advanced Security（Adaptive Authentication）の料金について、どの方針ですか？MAU 100-500 の場合、Advanced Security は $0.050/MAU の追加料金が発生します。

A) 有効化する — セキュリティ優先。MAU 500 でも月額 $25 程度で許容範囲
B) 初期は無効化し、MAU 増加後に有効化を検討 — コスト優先
C) Other (please describe after [Answer]: tag below)

[Answer]: A

