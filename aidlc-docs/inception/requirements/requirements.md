# SDLC — Sake Driven Life Cycle 要件定義書

## インテント分析サマリー

| 項目 | 内容 |
|---|---|
| ユーザーリクエスト | SDLCピッチデッキに基づくWebアプリケーション開発 |
| リクエストタイプ | 新規プロジェクト（New Project） |
| スコープ推定 | システム全体（6コア機能 + インフラ） |
| 複雑度推定 | Complex（AI統合、外部API連携、PWA、多言語、認証） |
| 要件深度 | Comprehensive |

---

## 1. プロジェクト概要

### 1.1 ビジョン
「人生のCI/CDに、和の余白を。」— 飲む日も、飲まない日も、同じUIの上で設計する日本酒ライフサイクルアプリケーション。

### 1.2 コンセプト
CI/CDの比喩を用いて、日本酒体験を6ステップのサイクル（Plan → Build → Test → Deploy → Monitor → Optimize）で設計する。「飲まない」選択（Skip Deploy）を一級市民として扱うことが最大の差別化ポイント。

### 1.3 ターゲットユーザー
- 日本酒初心者（1,400+蔵元から選べない人）
- 減酒志向の20代〜30代
- インバウンド観光客（英語対応）
- 日本酒愛好家（ペアリング・味覚探求）

### 1.4 将来展望
- スマホネイティブアプリ化を視野に入れる（iOS / Android）
- 現フェーズではPWAとして実装し、ネイティブアプリへのマイグレーションパスを確保する
- 設計方針:
  - ビジネスロジックをUI層から分離し、再利用可能にする
  - API層は変更なしでネイティブアプリからも利用可能な設計とする
  - カメラ・プッシュ通知等のデバイス機能はPWA APIで実装し、将来的にCapacitor等でネイティブブリッジに置換可能にする
  - 画像アップロード・認証フローはプラットフォーム非依存の設計とする

---

## 2. 機能要件

### FR-01: Sake Recommendation Engine（日本酒推薦エンジン）
- **概要**: 料理・気分・予定から銘柄×温度×適量×器を提案するソムリエAI
- **入力**: 料理名/写真、気分（テキスト/選択肢）、今日の予定、体調
- **出力**: 推薦銘柄リスト（銘柄名、温度、適量ml、推奨器、理由）
- **AI統合**: Amazon Bedrock Claude を使用したマルチモーダル推論
- **データソース**: さけのわAPI（フレーバーチャート、ランキング、銘柄情報）
- **帰属表示**: さけのわデータ利用時は https://sakenowa.com へのリンクを表示（利用規約準拠）

### FR-02: Don't Deploy Today モード（飲まない日の設計）★
- **概要**: 睡眠負債・服薬・翌朝の予定から「飲まない」を明確に推奨する機能
- **判定要素**: 体調スコア、服薬有無、翌日の予定重要度、睡眠負債
- **出力**: Skip Deploy推奨 + ノンアル代替提案（甘酒ソーダ等）
- **記録**: 「飲まない日」も同じ味覚グラフに記録
- **AI統合**: Bedrock Claude による総合判定と代替提案生成

### FR-03: Pairing Lab（ペアリング研究所）
- **概要**: 料理写真をBedrock Visionで解析し、ペアリングと燗温度を提案
- **入力方式**: テキスト入力（料理名）＋ 画像アップロード（カメラ撮影対応）の両方
- **出力**: ペアリング推薦（銘柄、温度帯、理由）、燗温度の詳細ガイド
- **AI統合**: Bedrock Claude Vision によるマルチモーダル解析

### FR-04: Sake Discovery（日本酒発見）
- **概要**: 酒蔵・産地・製法を多言語で学べる機能
- **コンテンツ**: 蔵元情報、地域別特徴、製法解説
- **データソース**: さけのわAPI（蔵元一覧、地域一覧）+ AI生成コンテンツ
- **多言語**: 日本語・英語の2言語対応
- **インバウンド接続**: 地域フィルタ、地図連携（将来拡張可能）

### FR-05: Next-Day Optimizer（翌日最適化）
- **概要**: カレンダー連携で翌日予定を逆算し、「最後の一杯」を通知
- **カレンダー連携**: Google Calendar API で翌日の予定を自動取得
- **ロジック**: 予定の重要度×開始時刻から逆算し、飲酒終了推奨時刻と適量を算出
- **通知**: EventBridge + Web Push (VAPID) によるプッシュ通知（PWA）
- **AI統合**: Bedrock Claude による予定重要度判定と適量計算

### FR-06: Personal Taste Graph（個人味覚グラフ）
- **概要**: 味覚プロファイルをレーダーチャートで可視化
- **味覚軸**: さけのわフレーバーチャートの6軸（華やか、芳醇、重厚、穏やか、ドライ、軽快）
- **記録**: 飲んだ銘柄の評価 + 飲まなかった日の記録
- **可視化**: レーダーチャート（6角形）で嗜好プロファイルを表示
- **嗜好更新**: 評価に基づいてスコアを更新し、次回推薦に反映
- **履歴**: 飲酒/非飲酒の履歴タイムライン表示

### FR-07: ユーザー認証・プロファイル管理
- **認証方式**: Amazon Cognito（メール＋パスワード＋ソーシャルログイン Google/Apple）
- **MFA**: TOTP（Time-based One-Time Password）による多要素認証（任意有効化）。リカバリーコード対応
- **パスワードポリシー**: NIST SP 800-63B §3.1.1 準拠（単一要素時15文字以上、MFA有効時8文字以上、文字種混合ルールなし、ブロックリスト照合）
- **プロファイル**: ニックネーム、言語設定、日本酒経験レベル、味覚プロファイル、飲酒履歴、設定
- **セッション管理**: JWT トークンベース

### FR-08: SDLCサイクルUI
- **概要**: Plan → Build → Test → Deploy → Monitor → Optimize の6ステップUI
- **Plan**: 予定・体調・料理から候補を立てる
- **Build**: 銘柄×温度×量×器を組み立てる
- **Test**: 一口で味を確認、ペアリング検証
- **Deploy**: 飲む or Skip Deploy（どちらも一級市民）
- **Monitor**: 睡眠・翌朝の状態・予定への影響を記録
- **Optimize**: Taste Graphに反映、次サイクルへ

### FR-09: Progressive Disclosure（3段階開示レイヤー）
- **概要**: ユーザーの習熟度に応じて情報の詳細度を段階的に開示する仕組み
- **Layer 1 — 感覚・感情軸（デフォルト）**: 技術用語ゼロ。気分・料理ジャンル・ビジュアル・2軸（甘辛×濃淡）のみ
- **Layer 2 — カテゴリ・産地軸**: 酒米産地、純米/吟醸タイプ（フレンドリーな説明付き）、温め/冷やし好み
- **Layer 3 — 専門軸**: 精米歩合・酵母・日本酒度、酒器提案、季節酒・限定酒
- **sakeExperience 連携**: beginner → Layer 1 スタート、intermediate → Layer 2 一部即解放、advanced → Layer 3 全解放。入力は任意（スキップ可、デフォルト Layer 1）
- **解放トリガー**: 特定カテゴリの「詳細」タップ → そのカテゴリの Layer 2 解放、ログ5件 → Layer 2 全体解放、ログ20件 → Layer 3 解放、Settings から手動で即全解放
- **AI統合**: プロンプトテンプレートに disclosureLevel パラメータを含め、Layer に応じた出力フォーマット（感覚的 vs 専門的）を切り替え
- **Taste Graph 連携**: 内部は6軸で計算。Layer 1 ユーザーには2軸（甘辛×濃淡）にマッピングして表示。Layer 2+ で6軸レーダーチャートを表示
- **影響範囲**: FR-01, FR-03, FR-04, FR-06, FR-08 の表示粒度に横断的に影響

---

## 3. 非機能要件

### NFR-01: パフォーマンス
- AI推論レスポンス: 5秒以内（Bedrock API呼び出し含む）
- ページ初期表示: 3秒以内（LCP）
- API応答時間: 500ms以内（キャッシュヒット時）

### NFR-01B: AI推論コスト戦略（詳細は NFR Requirements ステージで設計）
- **課題**: 6コア機能のうち5つでBedrock Claudeを呼び出す重AI構成。モデルバリアント・コスト目標が未定
- **方針**:
  - ユースケース別にモデルバリアントを使い分ける（高品質が必要な推薦/ペアリングと、軽量で十分な判定/学習コンテンツ）
  - Vision呼び出し（Pairing Lab画像解析）は特に高コストのため、利用頻度制限を検討
  - レート制限・トークン上限・月次コスト目標をNFR Requirementsで定義
- **NFR Requirements で作成する成果物**:
  - ユースケース別モデル選定マトリクス（機能 × モデルバリアント × 想定トークン数）
  - コスト試算（想定MAU × 推論回数/ユーザー × トークン × 単価）
  - コスト制御戦略（レスポンスキャッシュ、プロンプト最適化、モデルフォールバック）

### NFR-02: スケーラビリティ
- サーバーレスアーキテクチャによる自動スケーリング
- DynamoDB オンデマンドキャパシティ

### NFR-03: 可用性
- AWS マネージドサービスによる高可用性
- CloudFront によるグローバル配信

### NFR-04: セキュリティ
- SECURITY-01〜15 の全ルール適用（詳細は拡張ルール参照）
- Cognito による認証・認可
- API Gateway でのレート制限
- HTTPS 必須（TLS 1.2+）

### NFR-05: 多言語対応（i18n）
- 日本語（デフォルト）＋ 英語
- UI テキスト: i18n ライブラリ（react-i18next）
- AI応答: プロンプトで言語指定

### NFR-06: PWA対応
- オフライン対応（Service Worker）
- ホーム画面追加（Web App Manifest）
- プッシュ通知（Web Push VAPID + Service Worker。Pinpoint は 2026-10-30 EoS のため不採用）

### NFR-07: アクセシビリティ
- セマンティックHTML
- キーボードナビゲーション対応
- スクリーンリーダー対応（ARIA属性）
- カラーコントラスト比の確保

### NFR-08: テスト
- PBT-01〜10 の全ルール適用（詳細は拡張ルール参照）
- PBTフレームワーク: fast-check（TypeScript）
- 例示ベーステスト + プロパティベーステストの併用

---

## 4. 技術スタック

### フロントエンド
| 技術 | 用途 |
|---|---|
| React 19 + TypeScript | UIフレームワーク |
| Vite | ビルドツール |
| React Router | ルーティング |
| react-i18next | 多言語対応 |
| Recharts or Chart.js | レーダーチャート（Taste Graph） |
| Workbox | PWA Service Worker |
| S3 + CloudFront | ホスティング・CDN配信 |
| Vitest + fast-check | テスト（例示ベース + PBT） |

### バックエンド（AWS サーバーレス）
| 技術 | 用途 |
|---|---|
| API Gateway (REST) | APIエンドポイント |
| Lambda (Node.js/TypeScript) | ビジネスロジック |
| DynamoDB | データストア |
| Amazon Bedrock (Claude) | AI推論（テキスト + Vision） |
| Amazon Cognito | 認証・認可 |
| EventBridge | スケジュールイベント |
| Web Push (VAPID) + Service Worker | プッシュ通知（PWAネイティブ、AWS非依存） |
| S3 | 画像アップロード保存 |

### 外部API
| API | 用途 | キャッシュ戦略 |
|---|---|---|
| さけのわデータAPI | 銘柄・蔵元・フレーバー・ランキング | TTLキャッシュ（24時間） |
| Google Calendar API | 翌日予定取得 | リアルタイム取得 |

### さけのわデータAPI エンドポイント
| エンドポイント | 用途 |
|---|---|
| GET /api/areas | 地域一覧（47都道府県） |
| GET /api/brands | 銘柄一覧（ID, 名前, 蔵元ID） |
| GET /api/breweries | 蔵元一覧（ID, 名前, 地域ID） |
| GET /api/rankings | 総合・地域別ランキング |
| GET /api/flavor-charts | フレーバーチャート（6軸: 華やか, 芳醇, 重厚, 穏やか, ドライ, 軽快） |
| GET /api/flavor-tags | フレーバータグ一覧 |
| GET /api/brand-flavor-tags | 銘柄ごとのフレーバータグ |

---

## 5. データモデル概要

### ユーザー (Users)
- userId (PK), email, nickname, locale (ja/en), sakeExperience, authProvider, mfaEnabled, mfaSecret (暗号化), recoveryCodes (ハッシュ化), googleCalendarLinked, notificationEnabled, disclosureLevel (1/2/3, デフォルト:1), unlockedCategories (string[], Layer 2 個別解放済みカテゴリ), createdAt, updatedAt

### 味覚プロファイル (TasteProfiles)
- userId (PK), f1_hanayaka, f2_houjun, f3_juukou, f4_odayaka, f5_dry, f6_keikai, updatedAt

### 飲酒記録 (DrinkingLogs)
- userId (PK), timestamp (SK), brandId, temperature, amount_ml, vessel, rating, isSkipDeploy, notes

### さけのわキャッシュ (SakenowaCache)
- dataType (PK: brands/breweries/areas/rankings/flavors), data (JSON), ttl, fetchedAt

### Google OAuthトークン (UserTokens)
- userId (PK), accessToken (暗号化), refreshToken (暗号化), expiresAt

### 通知設定 (NotificationSettings)
- userId (PK), deviceToken, platform, reminderEnabled, morningLogEnabled, discoveryEnabled, updatedAt

---

## 6. 拡張機能設定

| 拡張機能 | 有効 | 適用モード |
|---|---|---|
| Security Baseline | Yes | Full（SECURITY-01〜15 全適用） |
| Property-Based Testing | Yes | Full（PBT-01〜10 全適用） |

---

## 7. トレーサビリティ

### ストーリー数サマリー（正式な集計は `aidlc-docs/inception/user-stories/stories.md` を参照）
| 優先度 | 件数 |
|---|---|
| Must | 19 |
| Should | 11 |
| Could | 1 |
| 合計 | 31 |

### ドキュメント相互参照
| 成果物 | パス | 同期対象 |
|---|---|---|
| 要件定義書 | `aidlc-docs/inception/requirements/requirements.md` | FR/NFR定義、データモデル、技術スタック |
| ユーザーストーリー | `aidlc-docs/inception/user-stories/stories.md` | ストーリー一覧、優先度、受け入れ基準 |
| ペルソナ | `aidlc-docs/inception/user-stories/personas.md` | ペルソナ定義、機能マトリクス |
| コンポーネント定義 | `aidlc-docs/inception/application-design/components.md` | コンポーネント一覧、Lambda関数数（31） |
| ユニット定義 | `aidlc-docs/inception/application-design/unit-of-work.md` | ユニット分解、関連ストーリー |
| ストーリーマッピング | `aidlc-docs/inception/application-design/unit-of-work-story-map.md` | ストーリー×ユニット割り当て（31件） |
| 統合設計 | `aidlc-docs/inception/application-design/application-design.md` | Lambda数（31）、DynamoDBテーブル数（5） |

⚠️ ストーリーの追加・削除時は上記すべてのドキュメントを同期更新すること。

---
