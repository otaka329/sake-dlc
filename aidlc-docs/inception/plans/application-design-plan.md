# SDLC — アプリケーション設計計画

## 設計概要
要件定義書（FR-01〜FR-08）とユーザーストーリー（US-01〜US-27）に基づき、コンポーネント構成、メソッド定義、サービス層、依存関係を設計する。

---

## 質問

以下の質問にお答えください。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

### Question 1
フロントエンドのコンポーネント設計パターンはどれが良いですか？

A) Feature-based（機能単位でディレクトリを分割: features/recommendation/, features/pairing/ 等）
B) Atomic Design（atoms/molecules/organisms/templates/pages の階層構造）
C) Page-based（ページ単位でディレクトリを分割: pages/plan/, pages/deploy/ 等）
D) お任せ（プロジェクト規模に最適なパターンを選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
バックエンドのLambda関数の分割粒度はどの程度が良いですか？

A) 機能単位（1 Lambda = 1コア機能: recommendation-handler, pairing-handler 等）
B) エンドポイント単位（1 Lambda = 1 APIエンドポイント: POST /recommend, GET /history 等）
C) ドメイン単位（1 Lambda = 1ドメイン: sake-domain, user-domain, calendar-domain 等）
D) お任せ（コスト・パフォーマンス・保守性のバランスで最適な粒度を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
AI推論（Bedrock Claude）の呼び出しパターンはどれが良いですか？

A) 直接呼び出し — 各Lambda関数から直接Bedrock APIを呼ぶ（シンプル）
B) AI Gateway パターン — AI呼び出し専用のLambda/サービスを1つ作り、他の関数はそこを経由する（一元管理）
C) プロンプトテンプレート管理 — プロンプトをDynamoDBやS3で管理し、AI Gateway経由で呼ぶ（柔軟性高い）
D) お任せ（推奨パターンを選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 4
状態管理（フロントエンド）のアプローチはどれが良いですか？

A) React Context + useReducer（軽量、外部依存なし）
B) Zustand（軽量状態管理ライブラリ、シンプルなAPI）
C) Redux Toolkit（大規模向け、DevTools充実）
D) TanStack Query（サーバー状態管理）+ React Context（ローカル状態）
E) お任せ（推奨を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
IaC（Infrastructure as Code）ツールはどれを使いますか？

A) AWS CDK（TypeScript）— フロントエンドと同じ言語で統一
B) AWS SAM（Serverless Application Model）— サーバーレスに特化
C) Terraform — マルチクラウド対応、宣言的
D) AWS CloudFormation（YAML/JSON）— AWSネイティブ
E) お任せ（推奨を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: C 

---

## 生成計画（回答後に実行）

- [x] Step 1: コンポーネント定義の生成（components.md）
- [x] Step 2: コンポーネントメソッド定義の生成（component-methods.md）
- [x] Step 3: サービス定義の生成（services.md）
- [x] Step 4: コンポーネント依存関係の生成（component-dependency.md）
- [x] Step 5: 統合設計ドキュメントの生成（application-design.md）
- [x] Step 6: 設計の整合性検証
