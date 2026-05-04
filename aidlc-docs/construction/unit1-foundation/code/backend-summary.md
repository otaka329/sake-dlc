# Unit 1: Foundation — バックエンドコードサマリー

## 生成ファイル一覧

### 基盤ライブラリ（backend/src/lib/）
| ファイル | 責務 |
|---|---|
| logger.ts | Powertools Logger ラッパー、PII マスク（SECURITY-03） |
| tracer.ts | Powertools Tracer ラッパー（X-Ray） |
| metrics.ts | Powertools Metrics ラッパー（EMF） |
| dynamodb.ts | DynamoDB DocumentClient シングルトン、テーブル名マッピング |
| errors.ts | AppError 階層（6クラス: Validation, Auth, Forbidden, NotFound, RateLimit, Internal） |
| response.ts | 構造化レスポンスヘルパー（success, error, created, noContent） |

### ミドルウェア（backend/src/middleware/）
| ファイル | 責務 |
|---|---|
| create-handler.ts | 共通ハンドラーラッパー（Logger/Tracer/Metrics/JWT抽出/レート制限/Zodバリデーション/エラーハンドリング） |
| rate-limiter.ts | DynamoDB アトミック演算による固定ウィンドウレート制限（100 req/min） |

### Lambda ハンドラー（backend/src/handlers/auth/）
| ファイル | エンドポイント | ストーリー |
|---|---|---|
| signup.ts | POST /signup | US-01, US-02, US-30 |
| get-profile.ts | GET /profile | — |
| put-profile.ts | PUT /profile | — |
| mfa-setup.ts | POST /mfa/setup | US-02B |
| mfa-verify.ts | POST /mfa/verify | US-02B |
| delete-mfa.ts | DELETE /mfa | US-02B |
| recovery-codes.ts | POST /mfa/recovery-codes | US-02B |
| put-disclosure-level.ts | PUT /disclosure-level | US-29 |
| pre-signup.ts | Cognito Pre Sign-up Trigger | US-01 |
| daily-backup.ts | EventBridge Schedule | — |

### テスト（backend/tests/）
- ユニットテスト: 13ファイル
- PBT: 8ファイル + 2ジェネレーター
