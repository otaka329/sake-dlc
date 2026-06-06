# Unit 2: AI Core — 技術スタック決定

---

## AI 推論

| 技術 | バージョン/モデル | 選定理由 |
|---|---|---|
| Amazon Bedrock | — | マネージド AI サービス。インフラ管理不要、従量課金 |
| Claude 3.5 Sonnet | anthropic.claude-3-5-sonnet-20241022-v2:0 | 推薦用。高品質な推薦文生成、JSON 構造化出力に強い |
| Claude 3 Haiku | anthropic.claude-3-haiku-20240307-v1:0 | 判定・メタ応答用。低コスト（Sonnet の 1/12）、高速レスポンス |

### モデル選定マトリクス

| ユースケース | 品質要求 | レイテンシ要求 | コスト感度 | 選定モデル |
|---|---|---|---|---|
| 日本酒推薦 | 高（銘柄選定の妥当性） | 中（5秒以内） | 中 | Sonnet |
| Don't Deploy 判定 | 中（理由文の質） | 高（3秒以内） | 高 | Haiku |
| ノンアル代替提案 | 低〜中 | 高 | 高 | Haiku |
| メタ応答 | 中（共感的トーン） | 高（2秒以内） | 高 | Haiku |

### Bedrock 設定

| 設定 | 推薦 (Sonnet) | 判定/メタ応答 (Haiku) |
|---|---|---|
| maxTokens | 2000 | 500 |
| temperature | 0.7（多様性確保） | 0.3（一貫性重視） |
| top_p | 0.9 | 0.9 |
| stop_sequences | — | — |

---

## プロンプトテンプレート管理

| 技術 | 選定理由 |
|---|---|
| DynamoDB（AppData テーブル、PK: SYSTEM） | バージョン管理、管理画面対応（将来）、Terraform シード投入 |
| Terraform Custom Resource（Lambda） | 初期テンプレート投入。apply 時に自動実行 |

### テンプレート一覧（Unit 2 スコープ）

| テンプレート ID | モデル | 用途 | 主要変数 |
|---|---|---|---|
| recommend | Sonnet | 日本酒推薦 | dishes, mood, tasteProfile, flavorData, disclosureLevel, locale |
| dont-deploy | Haiku | Don't Deploy 判定 | conditionScore, sleepHours, tomorrowSchedule, mood |
| alternative-proposal | Haiku | ノンアル代替提案 | season, mood, locale |
| meta-response | Haiku | メタ応答 | userMessage, locale |

---

## レスポンスキャッシュ

| 技術 | 選定理由 |
|---|---|
| DynamoDB（AppData テーブル、PK: userId） | 追加インフラ不要（ElastiCache は MAU 100-500 では過剰）。TTL で自動期限切れ |
| SHA-256（先頭16文字） | キャッシュキー生成。衝突確率は 2^64 で実用上問題なし |

---

## コスト計装

| 技術 | 用途 |
|---|---|
| Powertools Metrics | CloudWatch EMF 形式でカスタムメトリクス送出 |
| CloudWatch カスタムメトリクス | SDLC/AIGateway ネームスペース |

### メトリクス定義

| メトリクス | Dimensions | 用途 |
|---|---|---|
| InputTokens | ModelId, TemplateId | 入力トークン数追跡 |
| OutputTokens | ModelId, TemplateId | 出力トークン数追跡 |
| InvocationCount | ModelId, TemplateId | 呼び出し回数 |
| LatencyMs | ModelId, TemplateId | レイテンシ |
| CacheHitCount | — | キャッシュヒット数 |
| CacheMissCount | — | キャッシュミス数 |
| ParseFailureCount | TemplateId | パース失敗数 |
| DailyUsageCount | — | ユーザー全体の日次利用回数合計（per-user は DynamoDB AI_USAGE で管理。CW の高カーディナリティ回避） |

---

## セキュリティ

| 技術 | 用途 |
|---|---|
| XML タグ区切り + システムプロンプト指示 | プロンプトインジェクション防止 |
| Zod スキーマバリデーション | AI レスポンスの sanitization |
| IAM 最小権限（bedrock:InvokeModel） | Bedrock アクセス制御 |

---

## テスト

| 技術 | 用途 |
|---|---|
| Vitest + fast-check | ユニットテスト + PBT |
| msw (Mock Service Worker) | Bedrock API モック（テスト時） |
| DynamoDB Local | テンプレート・キャッシュのローカルテスト |

### Bedrock モック戦略

テスト時は Bedrock API を直接呼ばず、msw で固定レスポンスを返却:
- 正常レスポンス（構造化 JSON）
- パース失敗レスポンス（不正 JSON）
- タイムアウトレスポンス（遅延シミュレーション）
- スロットリングレスポンス（429）
