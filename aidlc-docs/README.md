# aidlc-docs — 設計ドキュメント読了ガイド

このディレクトリには、本プロジェクト（**Sake Driven Life Cycle**）を [AI-DLC (AI Driven Lifecycle)](https://pages.awscloud.com/summit-japan-2026-hackathon-reg.html) に沿って開発する過程で生成された全設計ドキュメントを収めています。

ドキュメントは AI-DLC のフェーズ進行に対応してフォルダ分けされているため、**上から順に読むと「要件 → 設計 → 実装 → 検証」の流れを追体験できます**。

> プロジェクト全体像・コンセプト・技術スタックは [リポジトリ ROOT の README](../README.md) を先に参照してください。

---

## 推奨される読み順

### STEP 0 — まず現在地を知る

| # | ドキュメント | 目的 |
|---|---|---|
| 0-1 | [`aidlc-state.md`](./aidlc-state.md) | 各フェーズの進捗・次に着手するステージ・後続ユニット引き継ぎ事項 |
| 0-2 | [`audit.md`](./audit.md) | AI-DLC 各ステップの実行記録（誰が・いつ・何を承認したか） |

「いまプロジェクトがどこまで進んでいるか」を把握してから、関心のあるフェーズに進んでください。

---

### STEP 1 — INCEPTION フェーズ（[`inception/`](./inception/)）

**「何を作るか」を固める**段階。要件 → ユーザーストーリー → アプリ設計 → ユニット分解 の順で抽象度を下げていきます。

#### 1-A. 要件定義（[`inception/requirements/`](./inception/requirements/)）
1. [`requirements.md`](./inception/requirements/requirements.md) — 機能要件 / セキュリティ要件 / PBT 要件のマスター
2. [`requirement-clarification-questions.md`](./inception/requirements/requirement-clarification-questions.md) — 要件確定までの Q&A 履歴
3. [`requirement-verification-questions.md`](./inception/requirements/requirement-verification-questions.md) — 要件レビューでのチェック項目

#### 1-B. ユーザーストーリー（[`inception/user-stories/`](./inception/user-stories/)）
1. [`personas.md`](./inception/user-stories/personas.md) — ターゲットユーザー像
2. [`stories.md`](./inception/user-stories/stories.md) — ユーザーストーリー一覧

#### 1-C. アプリケーション設計（[`inception/application-design/`](./inception/application-design/)）
読み順は「全体像 → コンポーネント → ユニット」と外側から内側へ：
1. [`application-design.md`](./inception/application-design/application-design.md) — アーキテクチャ全体像
2. [`services.md`](./inception/application-design/services.md) — サービス境界
3. [`components.md`](./inception/application-design/components.md) → [`component-dependency.md`](./inception/application-design/component-dependency.md) → [`component-methods.md`](./inception/application-design/component-methods.md) — コンポーネント定義 → 依存 → メソッド
4. [`unit-of-work.md`](./inception/application-design/unit-of-work.md) → [`unit-of-work-dependency.md`](./inception/application-design/unit-of-work-dependency.md) → [`unit-of-work-story-map.md`](./inception/application-design/unit-of-work-story-map.md) — Unit 1〜6 への分割と依存関係、ストーリーへのマッピング

#### 1-D. プラン（[`inception/plans/`](./inception/plans/)）
各ステージの実行計画です。**設計ドキュメントが「どういうプロセスを経て生成されたか」を知りたい場合に参照してください**。通常の読み込みでは飛ばして構いません。
- `execution-plan.md` / `story-generation-plan.md` / `application-design-plan.md` / `unit-of-work-plan.md` / `user-stories-assessment.md`

---

### STEP 2 — CONSTRUCTION フェーズ（[`construction/`](./construction/)）

**「どう作るか」を固めて実装する**段階。Unit 1 Foundation を先行開発済みです。

#### 2-A. Unit 1 Foundation 設計（[`construction/unit1-foundation/`](./construction/unit1-foundation/)）

機能 → 非機能 → インフラ の順で読むのが推奨です：

1. **機能設計** [`functional-design/`](./construction/unit1-foundation/functional-design/)
   - [`domain-entities.md`](./construction/unit1-foundation/functional-design/domain-entities.md) — ドメインエンティティ
   - [`business-rules.md`](./construction/unit1-foundation/functional-design/business-rules.md) — ビジネスルール（BR-XX）
   - [`business-logic-model.md`](./construction/unit1-foundation/functional-design/business-logic-model.md) — ロジックモデル
   - [`frontend-components.md`](./construction/unit1-foundation/functional-design/frontend-components.md) — フロント UI コンポーネント
2. **NFR 要件** [`nfr-requirements/`](./construction/unit1-foundation/nfr-requirements/)
   - [`nfr-requirements.md`](./construction/unit1-foundation/nfr-requirements/nfr-requirements.md) — 性能・可用性・セキュリティ等の数値目標
   - [`tech-stack-decisions.md`](./construction/unit1-foundation/nfr-requirements/tech-stack-decisions.md) — 技術選定の決定根拠
3. **NFR 設計** [`nfr-design/`](./construction/unit1-foundation/nfr-design/)
   - [`logical-components.md`](./construction/unit1-foundation/nfr-design/logical-components.md) — NFR 観点の論理コンポーネント
   - [`nfr-design-patterns.md`](./construction/unit1-foundation/nfr-design/nfr-design-patterns.md) — 採用パターン
4. **インフラ設計** [`infrastructure-design/`](./construction/unit1-foundation/infrastructure-design/)
   - [`infrastructure-design.md`](./construction/unit1-foundation/infrastructure-design/infrastructure-design.md) — AWS リソース構成
   - [`deployment-architecture.md`](./construction/unit1-foundation/infrastructure-design/deployment-architecture.md) — デプロイ構成
5. **コードサマリー** [`code/`](./construction/unit1-foundation/code/)
   - [`backend-summary.md`](./construction/unit1-foundation/code/backend-summary.md) — Lambda 実装の俯瞰
   - [`frontend-summary.md`](./construction/unit1-foundation/code/frontend-summary.md) — React/PWA 実装の俯瞰
   - [`infrastructure-summary.md`](./construction/unit1-foundation/code/infrastructure-summary.md) — Terraform 実装の俯瞰

#### 2-B. Build & Test（[`construction/build-and-test/`](./construction/build-and-test/)）

Unit 1 を実機で動かす手順書。コードを clone した直後の読者向けの入口です。
1. [`build-instructions.md`](./construction/build-and-test/build-instructions.md) — ビルド手順
2. [`unit-test-instructions.md`](./construction/build-and-test/unit-test-instructions.md) — ユニットテスト
3. [`integration-test-instructions.md`](./construction/build-and-test/integration-test-instructions.md) — 結合テスト
4. [`performance-test-instructions.md`](./construction/build-and-test/performance-test-instructions.md) — 性能テスト
5. [`build-and-test-summary.md`](./construction/build-and-test/build-and-test-summary.md) — Build & Test 全体結果サマリー

#### 2-C. プラン（[`construction/plans/`](./construction/plans/)）
Construction 各ステージの実行計画。**コード生成プロセス（全23ステップ）を追体験したい場合**は以下が起点になります：
- [`unit1-foundation-code-generation-plan.md`](./construction/plans/unit1-foundation-code-generation-plan.md)
- 他に functional-design / nfr-requirements / nfr-design / infrastructure-design の各 plan / questions

---

## 目的別クイックリンク

| 知りたいこと | 最短ルート |
|---|---|
| プロジェクトのコンセプトと現状 | ROOT [`README.md`](../README.md) → [`aidlc-state.md`](./aidlc-state.md) |
| 何を作る予定か（機能要件） | [`inception/requirements/requirements.md`](./inception/requirements/requirements.md) |
| 全体アーキテクチャ | [`inception/application-design/application-design.md`](./inception/application-design/application-design.md) |
| Unit 1 で実装した範囲 | [`construction/unit1-foundation/code/`](./construction/unit1-foundation/code/) 配下の 3 サマリー |
| ローカルで動かす手順 | [`construction/build-and-test/build-instructions.md`](./construction/build-and-test/build-instructions.md) |
| AI-DLC の実行履歴 | [`audit.md`](./audit.md) |

---

## ディレクトリ構造（要約）

```
aidlc-docs/
├── README.md                       ← このファイル
├── aidlc-state.md                  ← フェーズ進捗
├── audit.md                        ← AI-DLC 実行ログ
├── inception/
│   ├── requirements/               ← 要件定義
│   ├── user-stories/               ← ペルソナ・ストーリー
│   ├── application-design/         ← アプリ設計・ユニット分解
│   └── plans/                      ← Inception 各ステージの実行計画
└── construction/
    ├── plans/                      ← Construction 各ステージの実行計画
    ├── unit1-foundation/           ← Unit 1 設計成果物
    │   ├── functional-design/
    │   ├── nfr-requirements/
    │   ├── nfr-design/
    │   ├── infrastructure-design/
    │   └── code/                   ← 実装サマリー
    └── build-and-test/             ← ビルド・テスト手順書と結果
```

Unit 2〜6 の Construction ドキュメントは未着手です。生成され次第、`construction/unit2-*/` 以降が増えていきます。
