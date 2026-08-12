# Unit 2: AI Core — フロントエンドコードサマリー

## 生成ファイル一覧

### Context（frontend/src/contexts/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| PlanContext.tsx | Plan 入力状態管理（体調/予定/料理/気分/deployAdvice/isLoading） | US-04, US-06 |

### Plan Feature（frontend/src/features/plan/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| pages/PlanPage.tsx | Plan 画面（カード式4枚 + DeployAdvice + 自動判定） | US-04, US-06 |
| components/ConditionCard.tsx | 体調入力（スコア/服薬/睡眠） | US-04 |
| components/ScheduleCard.tsx | 翌日予定入力（重要度/開始時刻/概要） | US-04 |
| components/DishCard.tsx | 料理入力（テキスト + カテゴリサジェスト、10件上限） | US-06 |
| components/MoodCard.tsx | 気分入力 | US-04 |
| components/DeployAdviceDisplay.tsx | Deploy 判定結果表示 + ノンアル代替提案 | US-09, US-10 |
| hooks/useDontDeploy.ts | 1秒デバウンス自動判定（初回スキップ + AbortController + レース対策） | US-09 |
| api/plan-api.ts | POST /dont-deploy（signal 対応） | US-09 |
| data/dish-suggestions.ts | 静的カテゴリリスト（BR-15、8カテゴリ × 代表料理） | US-06 |

### Build Feature（frontend/src/features/build/）
| ファイル | 責務 | ストーリー |
|---|---|---|
| pages/BuildPage.tsx | Build 画面（推薦実行 + 結果表示 + メタ質問） | US-08, US-16 |
| components/RecommendationList.tsx | 推薦結果リスト | US-08 |
| components/RecommendationCard.tsx | 推薦カード（Layer 別表示 + カスタマイズ UI） | US-08, US-11 |
| components/MetaResponseDialog.tsx | メタ応答ダイアログ | US-16 |
| hooks/useRecommend.ts | POST /recommend（ローディング + エラー + AbortController） | US-08 |
| hooks/useMetaResponse.ts | POST /meta-response | US-16 |
| api/build-api.ts | postRecommend, postMetaResponse（signal 対応） | US-08, US-16 |

### App.tsx 更新
- `/` → PlanPage、`/build` → BuildPage に PlaceholderPage から差し替え
- PlanProvider を AppShell の親に配置（Plan → Build 遷移時に入力データ維持）

### i18n（frontend/src/i18n/locales/）
| ファイル | 内容 |
|---|---|
| ja/plan.json | Plan 画面テキスト（カードラベル、判定結果、代替提案） |
| en/plan.json | 同上（英語） |
| ja/build.json | Build 画面テキスト（推薦、カスタマイズ、メタ応答） |
| en/build.json | 同上（英語） |

### テスト
- ユニットテスト: 7ファイル（PlanContext, PlanPage, DishCard, DeployAdviceDisplay, BuildPage, RecommendationCard, MetaResponseDialog）
- PBT: 2ファイル（amount-clamp, disclosure-recommendation-fields）

---

## 既知の残課題（Step 15 以降で対応検討）

| 課題 | 対応方針 | 引受先 |
|---|---|---|
| リロード/直接遷移で Plan 入力消失 | BuildPage に「Plan 未入力」ガード（/ へ誘導） | Unit 2 Build and Test |
| useMetaResponse のエラー表示なし（H1） | error state 追加 | Unit 2 Build and Test |
| エラー文言が生 Error.message（H2） | HTTPError → i18n errors.json キー振り分け | Unit 2 Build and Test |
| name/mood/summary の maxLength 未設定（M3 残） | input に maxLength 属性追加 | Unit 2 Build and Test |
| i18n 遅延ロード未実装（M4） | 現状は eager import。バンドルサイズ監視で判断 | Unit 6 Infrastructure |
| サジェスト blur で閉じない（L3） | useClickOutside hook 追加 | Unit 3 以降 |
| RecommendationCard カスタマイズ値がローカル止まり（L1） | Unit 4 Deploy 画面で PlanContext に統合 | Unit 4 |
| さけのわ帰属表記の Single Source of Truth（M1） | サーバの attribution を使用に統一 | Unit 2 Build and Test |
| MetaResponseDialog a11y（role=dialog, Escape, フォーカストラップ） | Unit 3 以降 | Unit 3 以降 |
| askMeta('飲むべき？') 日本語ハードコード | t('metaQuestionMessage') に切り出し | Unit 2 Build and Test |
| disclosure-recommendation-fields.pbt.ts トートロジー（P8） | RecommendationCard レンダリング版に書き直し | Unit 2 Build and Test |
| DeployAdviceDisplay.test.tsx 不十分（P8） | deploy/skip_deploy/alternatives の描画テスト追加 | Unit 2 Build and Test |
| BuildPage 統合テストなし（P8） | PlanPage入力→BuildPage反映のテスト追加 | Unit 2 Build and Test |
| ErrorCount 名前空間不一致（P7） | create-handler のメトリクス名前空間整理 | Unit 6 Infrastructure |
| アラーム dimensions 未指定（P7） | デプロイ後に実ディメンション確認して追加 | Unit 6 Infrastructure |
