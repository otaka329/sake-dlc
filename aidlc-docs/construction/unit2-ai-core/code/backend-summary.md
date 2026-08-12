# Unit 2: AI Core — バックエンドコードサマリー

## 生成ファイル一覧

### AIGateway コアモジュール（backend/src/lib/ai-gateway/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| index.ts | ファサード: invoke + ドライラン + リトライ + コスト計装 | US-08, US-09, US-16 |
| template-manager.ts | DynamoDB Query テンプレート取得 + 変数置換 + 未置換検証 + {{}}サニタイズ | — |
| bedrock-invoker.ts | Bedrock InvokeModel Tool Use + タイムアウト + 429/5xx 処理 | — |
| response-parser.ts | Tool Use 出力 Zod バリデーション + リトライ判定 | — |
| cache-manager.ts | キャッシュキー正規化（カテゴリ/mood/量子化）+ DynamoDB 読み書き | — |
| cost-controller.ts | 推薦回数制限アトミック + コスト計装 + ドライランモード + estimateCost | — |

### Tool Use スキーマ（backend/src/lib/ai-gateway/schemas/）
| ファイル | 用途 |
|---|---|
| recommend-tool.ts | 推薦 Tool Use（minItems:3, maxItems:5, matchScore [0,1]） |
| dont-deploy-tool.ts | 判定 Tool Use |
| alternative-tool.ts | 代替提案 Tool Use |
| meta-response-tool.ts | メタ応答 Tool Use |

### サービス層（backend/src/services/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| recommendation-service.ts | BL-11: キャッシュ判定 → AI推薦 → flavorScores Lambda付与 → コスト計装 | US-08, US-11 |
| dont-deploy-service.ts | BL-12: ルールベース Phase 1 → AI判定 Phase 2 → 代替提案 BL-13 | US-09, US-10 |
| meta-response-service.ts | BL-14: パターン検出 → AI メタ応答 | US-16 |

### Lambda ハンドラー（backend/src/handlers/ai/）
| ファイル | エンドポイント | ストーリー |
|---|---|---|
| recommend.ts | POST /recommend | US-08, US-11 |
| dont-deploy.ts | POST /dont-deploy | US-09, US-10 |
| meta-response.ts | POST /meta-response | US-16 |
| seed-prompts.ts | Custom Resource（テンプレート DynamoDB 投入） | — |

### プロンプト本文（backend/src/handlers/ai/prompt-bodies/）
| ファイル | 用途 |
|---|---|
| recommend.txt | 日本酒推薦プロンプト |
| dont-deploy.txt | Don't Deploy 判定プロンプト |
| alternative-proposal.txt | ノンアル代替提案プロンプト |
| meta-response.txt | メタ応答プロンプト |

### 共通ヘルパー（backend/src/lib/）
| ファイル | 責務 |
|---|---|
| user-profile.ts | getUserProfileInfo（locale + disclosureLevel 取得、ハンドラー共通） |

### shared-types 追加（packages/shared-types/src/）
| ファイル | 内容 |
|---|---|
| schemas/plan-input.ts | PlanInput, DishInput Zod スキーマ |
| schemas/recommendation.ts | Recommendation, TemperatureRecommendation, FlavorScores, RecommendationResponse |
| schemas/deploy-advice.ts | DeployAdvice, AlternativeProposal |
| schemas/meta-response.ts | MetaResponse, MetaResponseRequest |
| schemas/prompt-template.ts | PromptTemplate |
| types/dish-category.ts | DISH_CATEGORIES 8+other enum（BR-15 統一） |

### テスト
- ユニットテスト: 10ファイル（template-manager, cache-manager, cost-controller, response-parser, services×3, handlers×3）
- PBT: 7ファイル（cache-key, matchScore, dailyUsage, dontDeployRules, templateSubstitution, recommendationCount, costMetrics）
- PBT 検出バグ: estimateCost プロトタイプ汚染（修正済み）
