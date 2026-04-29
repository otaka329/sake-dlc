# Unit 1: Foundation — Functional Design 計画

## ユニット概要
- **責務**: インフラ基盤、認証、共通コンポーネント、フロントエンド骨格
- **ストーリー**: US-01（メール登録）, US-02（ソーシャルログイン）, US-03（言語設定）, US-25（ホーム画面追加）, US-26（オフライン対応）

---

## 質問

### Question 1
ユーザー初期プロファイル設定（サインアップ後）で、どの情報を収集しますか？

A) ニックネームのみ（最小限、後から設定可能）
B) ニックネーム + 言語設定 + 日本酒経験レベル（初心者/中級/上級）
C) ニックネーム + 言語設定 + 日本酒経験レベル + 好みの味覚傾向（甘口/辛口等の簡易質問）
D) お任せ
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2
SDLCサイクルのメインUI構成はどのようなイメージですか？

A) タブナビゲーション — 下部タブで Plan/Build/Test/Deploy/Monitor/Optimize を切り替え
B) ステッパーUI — 1画面で6ステップを順番に進む（ウィザード形式）
C) ダッシュボード型 — ホーム画面にカード形式で各ステップへのエントリーポイントを配置
D) お任せ
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 生成計画（回答後に実行）

- [x] Step 1: ドメインエンティティ定義（domain-entities.md）
- [x] Step 2: ビジネスルール定義（business-rules.md）
- [x] Step 3: ビジネスロジックモデル定義（business-logic-model.md）
- [x] Step 4: フロントエンドコンポーネント設計（frontend-components.md）
