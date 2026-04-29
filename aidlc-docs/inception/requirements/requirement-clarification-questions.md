# SDLC — 要件追加確認質問

前回の回答を分析した結果、以下の点について追加の確認が必要です。各質問の `[Answer]:` タグの後に選択肢の文字を記入してください。

---

## 曖昧点 1: フロントエンドフレームワーク選定（Q2の深掘り）

### Clarification Question 1
フロントエンドのビルドツールとホスティング方式はどちらが良いですか？

A) Vite + React SPA → S3 + CloudFront でホスティング（シンプル、サーバーレスと相性良い）
B) Next.js SSR → Lambda@Edge or Amplify でホスティング（SEO有利、初期表示速い）
C) Next.js Static Export → S3 + CloudFront でホスティング（Next.jsの開発体験 + 静的ホスティング）
D) お任せ（アーキテクチャ的に最適な方を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 曖昧点 2: 認証方式（Q4の深掘り）

### Clarification Question 2
認証方式はどれを採用しますか？

A) Amazon Cognito（メール＋パスワード）— AWSネイティブで他サービスとの統合が容易
B) Amazon Cognito（ソーシャルログイン：Google/Apple対応）— ユーザー登録のハードルが低い
C) Amazon Cognito（メール＋パスワード＋ソーシャルログイン両対応）
D) お任せ（推奨方式を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## 曖昧点 3: Personal Taste Graph の実装レベル（Q8の深掘り）

### Clarification Question 3
Personal Taste Graph の実装方針はどうしますか？

A) 本格実装 — 味覚を5〜8軸のベクトルで表現し、DynamoDBに格納。類似銘柄の近傍検索も実装
B) 中間実装 — 味覚プロファイルをレーダーチャートで可視化。飲んだ/飲まなかった履歴を記録し、嗜好スコアを更新
C) 軽量実装 — 飲酒履歴の記録と簡易的な好み傾向の表示のみ。ベクトル化は将来対応
D) お任せ（スコープとスケジュールに応じて最適なレベルを提案してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## 曖昧点 4: Next-Day Optimizer の実装レベル（Q9の深掘り）

### Clarification Question 4
Next-Day Optimizer の実装方針はどうしますか？

A) 外部カレンダー連携（Google Calendar API）— 翌日の予定を自動取得して判断
B) 手動入力方式 — ユーザーが「明日の予定」を入力し、AIが適量・終了時刻を逆算
C) 時間ベースルール — 現在時刻と起床予定時刻から自動計算（カレンダー連携なし）
D) お任せ（スコープとスケジュールに応じて最適なレベルを提案してほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 曖昧点 5: Pairing Lab の画像対応（Q6の深掘り）

### Clarification Question 5
Pairing Lab でユーザーが料理写真をアップロードする機能は実装しますか？

A) はい — カメラ撮影＋画像アップロード → Bedrock Vision で解析 → ペアリング提案
B) はい — 画像アップロードのみ（カメラ撮影なし）→ Bedrock Vision で解析
C) テキスト入力＋画像アップロードの両方に対応（ユーザーが選べる）
D) お任せ（推奨方式を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## 曖昧点 6: PWA対応

### Clarification Question 6
PWA（Progressive Web App）対応は必要ですか？

A) はい — オフライン対応、ホーム画面追加、プッシュ通知を含むフルPWA
B) はい — ホーム画面追加とプッシュ通知のみ（オフライン対応は不要）
C) いいえ — 通常のWebアプリとして実装（PWAは将来対応）
D) お任せ（推奨を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 曖昧点 7: さけのわデータのキャッシュ戦略

### Clarification Question 7
さけのわデータのキャッシュ方針はどうしますか？

A) 日次バッチ — EventBridgeで1日1回データを取得し、DynamoDBにキャッシュ
B) 初回取得＋TTLキャッシュ — 初回アクセス時に取得し、一定期間（例：24時間）キャッシュ
C) デプロイ時に一括取得 — ビルド/デプロイ時にデータを取得してDynamoDBに格納
D) お任せ（負荷配慮を最優先で最適な方式を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B
