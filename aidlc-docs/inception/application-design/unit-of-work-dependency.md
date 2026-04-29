# SDLC — ユニット依存関係

---

## 依存関係マトリクス

| ユニット | Unit 1 Foundation | Unit 2 AI Core | Unit 3 Pairing | Unit 4 Lifecycle | Unit 5 External | Unit 6 Infra |
|---|---|---|---|---|---|---|
| Unit 1 Foundation | — | | | | | ● |
| Unit 2 AI Core | ● | — | ● | ● | | ● |
| Unit 3 Pairing | ● | | — | | | ● |
| Unit 4 Lifecycle | ● | | ● | — | | ● |
| Unit 5 External | ● | | | ● | — | ● |
| Unit 6 Infra | | | | | | — |

● = 依存あり（行のユニットが列のユニットに依存）

---

## 依存関係の詳細

### Unit 2 → Unit 1 (Foundation)
- AuthMiddleware（JWT検証）
- Logger（構造化ログ）
- API Gateway基盤
- Cognito認証

### Unit 2 → Unit 3 (Pairing)
- SakenowaClient（フレーバーデータ取得）— CM-02を共有

### Unit 2 → Unit 4 (Lifecycle)
- TasteProfiles テーブル（ユーザー嗜好の読み取り）

### Unit 3 → Unit 1 (Foundation)
- AuthMiddleware, Logger, API Gateway基盤

### Unit 4 → Unit 1 (Foundation)
- AuthMiddleware, Logger, API Gateway基盤

### Unit 4 → Unit 3 (Pairing)
- SakenowaClient（銘柄フレーバーデータ取得 — TasteProfile更新時）

### Unit 5 → Unit 1 (Foundation)
- AuthMiddleware, Logger, API Gateway基盤

### Unit 5 → Unit 4 (Lifecycle)
- DrinkingLogs テーブル（飲酒終了時刻の通知トリガー）

### 全ユニット → Unit 6 (Infra)
- Terraform モジュール（各ユニットのインフラ定義）

---

## 開発順序図

```
Phase 0 (先行):
  ┌──────────────────────────────────────┐
  | Unit 1 Foundation                    |
  | - 認証、共通コンポーネント            |
  | - CM-01/CM-02 インターフェース＋スタブ |
  | - DynamoDB 全6テーブルスキーマ定義     |
  └──────────────┬───────────────────────┘
                 |
  ┌──────────────v───────────────────────┐
  | Unit 6 Infrastructure                |
  | （Unit 1 と並行着手可能）             |
  └──────────────┬───────────────────────┘
                 |
Phase 1 (並行 — インターフェース確定済みのため待ちなし):
  ┌──────────────v───────┐
  | Unit 2 AI Core       |
  | CM-01 本実装          |
  ├──────────────────────┤
  | Unit 3 Pairing &     |
  | Discovery             |
  | CM-02 本実装          |
  ├──────────────────────┤
  | Unit 4 Lifecycle      |
  | Tracking              |
  ├──────────────────────┤
  | Unit 5 External       |
  | Integration           |
  └──────────────────────┘

Phase 2 (統合):
  ┌──────────────────────┐
  | 全ユニット統合テスト   |
  | CM-01/CM-02 スタブ →  |
  | 本実装に差し替え       |
  └──────────────────────┘
```

### Phase 2: スタブ→本実装 統合手順

#### マージ手順
1. Unit 2（CM-01 AIGateway 本実装）と Unit 3（CM-02 SakenowaClient 本実装）の完了を確認
2. Unit 1 のスタブ実装を本実装に差し替え（同一インターフェースのため、import先の変更のみ）
3. 各ユニットの単体テストを本実装で再実行し、全パス確認
4. ユニット間の結合テストを実行（Unit 2 → CM-02 本実装、Unit 4 → CM-02 本実装、Unit 5 → DrinkingLogs 本実装）

#### 受け入れ条件
- [ ] CM-01 本実装が Unit 1 で定義したインターフェースに完全準拠すること
- [ ] CM-02 本実装が Unit 1 で定義したインターフェースに完全準拠すること
- [ ] スタブ→本実装差し替え後、全ユニットの単体テストが100%パスすること
- [ ] ユニット間結合テスト（API呼び出しチェーン）が正常動作すること
- [ ] さけのわAPI実データでの E2E テストが正常動作すること

#### 統合リスク軽減策
- Unit 1 のインターフェース定義に TypeScript の `interface` / `type` を使用し、コンパイル時に不整合を検出
- スタブ実装はテストデータを返す実装とし、本実装との振る舞いの差異を最小化
- CI で各ユニットのテストをスタブ版・本実装版の両方で実行可能にする

### 並行開発を可能にする前提条件
Unit 1 で以下を先行確定することで、Unit 2〜5 間の依存を解消：

| 共有リソース | Unit 1 で確定する内容 | 実装責任（データアクセスロジック） | 利用ユニット |
|---|---|---|---|
| CM-01 AIGateway | TypeScriptインターフェース定義 + スタブ実装 | Unit 2（本実装） | Unit 3, Unit 4 |
| CM-02 SakenowaClient | TypeScriptインターフェース定義 + スタブ実装 | Unit 3（本実装） | Unit 2, Unit 4 |
| DynamoDB TasteProfiles | Terraformスキーマ定義（PK, 属性, GSI） | Unit 4（CRUD実装） | Unit 2（読み取り） |
| DynamoDB DrinkingLogs | Terraformスキーマ定義（PK, SK, 属性, GSI） | Unit 4（CRUD実装） | Unit 5（読み取り） |
| DynamoDB SakenowaCache | Terraformスキーマ定義（PK, TTL） | Unit 3（CRUD実装） | Unit 2, Unit 4（読み取り） |
| DynamoDB UserTokens | Terraformスキーマ定義（PK） | Unit 5（CRUD実装） | — |
| DynamoDB NotificationSettings | Terraformスキーマ定義（PK） | Unit 5（CRUD実装） | — |

---

## 共有リソース

| リソース | スキーマ/IF定義 | 実装責任（本実装） | 利用ユニット |
|---|---|---|---|
| CM-01 AIGateway | Unit 1（IF＋スタブ） | Unit 2 | Unit 3, Unit 4 |
| CM-02 SakenowaClient | Unit 1（IF＋スタブ） | Unit 3 | Unit 2, Unit 4 |
| CM-03 AuthMiddleware | Unit 1 | Unit 1 | Unit 2, 3, 4, 5 |
| CM-04 Logger | Unit 1 | Unit 1 | 全ユニット |
| DynamoDB Users | Unit 1（Terraform） | Unit 1（CRUD） | 全ユニット（読み取り） |
| DynamoDB TasteProfiles | Unit 1（Terraform） | Unit 4（CRUD） | Unit 2（読み取り） |
| DynamoDB SakenowaCache | Unit 1（Terraform） | Unit 3（CRUD） | Unit 2, Unit 4（読み取り） |
| DynamoDB DrinkingLogs | Unit 1（Terraform） | Unit 4（CRUD） | Unit 5（読み取り） |
| DynamoDB UserTokens | Unit 1（Terraform） | Unit 5（CRUD） | — |
| DynamoDB NotificationSettings | Unit 1（Terraform） | Unit 5（CRUD） | — |
| S3 Prompts | Unit 1（Terraform） | Unit 2（テンプレート管理） | Unit 3（学習コンテンツ生成） |
