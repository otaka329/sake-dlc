# Unit 1: Foundation — NFR Requirements 計画

## ユニット概要
- **責務**: インフラ基盤、認証（Cognito + MFA）、共通コンポーネント（AuthMiddleware, Logger, AIGateway IF, SakenowaClient IF）、フロントエンド骨格（React SPA + PWA）、全6テーブルスキーマ定義
- **関連NFR**: NFR-01（パフォーマンス）、NFR-01B（AIコスト戦略）、NFR-04（セキュリティ）、NFR-05（多言語）、NFR-06（PWA）、NFR-07（アクセシビリティ）、NFR-08（テスト）

---

## 質問

### Question 1
Cognito のセッション有効期限はどの程度が良いですか？

A) アクセストークン: 1時間、リフレッシュトークン: 30日（Cognito デフォルト）
B) アクセストークン: 15分、リフレッシュトークン: 7日（セキュリティ重視）
C) アクセストークン: 1時間、リフレッシュトークン: 90日（利便性重視）
D) お任せ（NIST SP 800-63B のAAL1/AAL2ガイドラインに準拠して選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
API Gateway のレート制限はどの程度に設定しますか？

A) 厳格 — 100 req/sec/ユーザー、バースト200（小規模PoC向け）
B) 標準 — 500 req/sec/ユーザー、バースト1000（一般的なWebアプリ向け）
C) 緩め — 1000 req/sec/ユーザー、バースト2000（高トラフィック想定）
D) お任せ（想定ユーザー数に応じて最適値を選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
想定ユーザー規模（初期リリース時）はどの程度ですか？

A) 小規模 — MAU 100〜500人（ハッカソンデモ＋α）
B) 中規模 — MAU 1,000〜5,000人（初期ユーザー獲得フェーズ）
C) 大規模 — MAU 10,000人以上（本格サービス）
D) まずはハッカソンデモとして動けばよい（スケーラビリティは後回し）
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
CloudWatch ログの保持期間はどの程度にしますか？

A) 90日（SECURITY-14 の最低要件）
B) 180日
C) 365日（1年）
D) お任せ（セキュリティ要件とコストのバランスで選んでほしい）
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5
フロントエンドのバンドルサイズ目標はどの程度ですか？

A) 厳格 — 初期ロード 200KB 以下（gzip後）、LCP 2秒以内
B) 標準 — 初期ロード 500KB 以下（gzip後）、LCP 3秒以内
C) 緩め — 特に制限なし（機能優先）
D) お任せ
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 生成計画（回答後に実行）

- [x] Step 1: NFR要件定義の生成（nfr-requirements.md）
- [x] Step 2: 技術スタック決定の生成（tech-stack-decisions.md）
- [x] Step 3: セキュリティ拡張ルール準拠チェック
- [x] Step 4: PBT拡張ルール準拠チェック
