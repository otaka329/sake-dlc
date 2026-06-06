# Unit 2: AI Core — フロントエンドコンポーネント設計

---

## FE-02: PlanFeature（Plan 画面）

### PlanPage（/ ルート）

- **責務**: 体調・予定・料理の入力カード + Deploy 判定結果表示
- **UI パターン**: カード式（任意順序、スキップ可）
- **カード構成**:
  1. ConditionCard — 体調スコア（5段階スライダー）、服薬チェックボックス、睡眠時間
  2. ScheduleCard — 翌日予定（Google Calendar 連携 or 手動入力）、重要度
  3. DishCard — 料理入力（テキスト + サジェスト）、複数追加可
  4. MoodCard — 気分テキスト入力（任意）
- **状態管理**: PlanContext（useReducer）で全カード入力を管理
- **API 統合**:
  - POST /dont-deploy（カード入力完了時に自動呼び出し）
  - レスポンスの DeployAdvice を画面下部に表示

### ConditionCard

- **Props**: なし（PlanContext から読み書き）
- **フォームフィールド**:
  - conditionScore: スライダー（1-5）、デフォルト 3
  - isMedicated: チェックボックス
  - sleepHours: 数値入力（0-24）
- **data-testid**: `plan-condition-score-slider`, `plan-condition-medicated-checkbox`, `plan-condition-sleep-input`

### ScheduleCard

- **Props**: なし
- **フォームフィールド**:
  - tomorrowScheduleImportance: スライダー（1-5）
  - tomorrowEarliestStart: 時刻入力（HH:mm）。Google Calendar 連携時は自動入力
  - tomorrowScheduleSummary: テキスト入力（Google Calendar 連携時は自動入力）
- **Google Calendar 連携**: Unit 5 で実装。Unit 2 では手動入力のみ
- **data-testid**: `plan-schedule-importance-slider`, `plan-schedule-earliest-start-input`, `plan-schedule-summary-input`

### DishCard

- **Props**: なし
- **フォームフィールド**:
  - dishes[]: テキスト入力 + サジェストドロップダウン
  - 「料理を追加」ボタンで複数追加
- **サジェスト**: 静的カテゴリリスト（BR-15）。入力文字でフィルタ
- **data-testid**: `plan-dish-input-{index}`, `plan-dish-add-button`, `plan-dish-suggest-{category}`

### MoodCard

- **Props**: なし
- **フォームフィールド**:
  - mood: テキスト入力（プレースホルダー: 「今日の気分は？」）
- **data-testid**: `plan-mood-input`

### DeployAdviceDisplay

- **Props**: advice: DeployAdvice | null
- **表示**:
  - Deploy 推奨: 「今日は飲みましょう 🍶」+ 理由
  - Skip Deploy 推奨: 「今日はお休みしましょう ☕」+ 理由 + ノンアル代替提案
- **data-testid**: `plan-deploy-advice`, `plan-deploy-advice-decision`, `plan-alternatives-list`

---

## FE-03: BuildFeature（Build 画面）

### BuildPage（/build ルート）

- **責務**: AI 推薦の実行 + 結果表示 + カスタマイズ
- **フロー**:
  1. Plan 入力データを PlanContext から取得
  2. 「推薦を受ける」ボタンで POST /recommend 呼び出し
  3. 推薦結果を RecommendationList で表示
  4. ユーザーがカスタマイズ（温度・量変更）
  5. 確定 → Deploy 画面（Unit 4）に遷移

### RecommendationList

- **Props**: recommendations: Recommendation[], disclosureLevel: DisclosureLevel
- **表示**: RecommendationCard の縦リスト
- **data-testid**: `build-recommendation-list`

### RecommendationCard

- **Props**: recommendation: Recommendation, disclosureLevel: DisclosureLevel
- **Layer 別表示**:
  - **Layer 1（感覚モード）**: 銘柄名 + 温度ラベル（冷やして/温めて）+ 適量 + 感覚的理由
  - **Layer 2（カテゴリモード）**: Layer 1 + 純米/吟醸タイプ + 産地 + フレーバー概要
  - **Layer 3（専門モード）**: Layer 2 + 精米歩合 + 酵母 + 日本酒度 + 酒器提案
- **カスタマイズ UI**:
  - 温度帯セレクト: 冷酒 / 常温 / ぬる燗 / 熱燗
  - 適量スライダー: 30〜300ml
- **さけのわ帰属表示**: カード下部に「データ提供: さけのわ」リンク
- **data-testid**: `build-recommendation-card-{index}`, `build-recommendation-temperature-select-{index}`, `build-recommendation-amount-slider-{index}`

### MetaResponseDialog

- **Props**: なし
- **表示条件**: ユーザーが判断委任的な質問をした場合（テキスト入力検出 or 「飲むべき？」ボタン）
- **表示**: 思慮深い応答メッセージ + 代替アクション提案
- **data-testid**: `build-meta-response-dialog`, `build-meta-response-message`

---

## React Context 追加定義

### PlanContext

```typescript
interface PlanState {
  conditionScore: number;     // 1-5, default 3
  isMedicated: boolean;       // default false
  sleepHours: number | null;  // null = 未入力
  tomorrowScheduleImportance: number; // 1-5, default 3
  tomorrowEarliestStart: string;      // HH:mm, default ''
  tomorrowScheduleSummary: string;
  dishes: DishInput[];
  mood: string;
  deployAdvice: DeployAdvice | null;
  isLoading: boolean;
}

type PlanAction =
  | { type: 'SET_CONDITION'; payload: Partial<Pick<PlanState, 'conditionScore' | 'isMedicated' | 'sleepHours'>> }
  | { type: 'SET_SCHEDULE'; payload: Partial<Pick<PlanState, 'tomorrowScheduleImportance' | 'tomorrowEarliestStart' | 'tomorrowScheduleSummary'>> }
  | { type: 'ADD_DISH'; payload: DishInput }
  | { type: 'REMOVE_DISH'; payload: number }
  | { type: 'SET_MOOD'; payload: string }
  | { type: 'SET_DEPLOY_ADVICE'; payload: DeployAdvice }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };
```

---

## API 統合ポイント

| コンポーネント | API エンドポイント | メソッド | 説明 |
|---|---|---|---|
| PlanPage | POST /dont-deploy | REST | Don't Deploy 判定 |
| BuildPage | POST /recommend | REST | AI 日本酒推薦 |
| BuildPage | POST /meta-response | REST | メタ応答 |

---

## i18n namespace 追加

| namespace | 内容 | ロードタイミング |
|---|---|---|
| plan | Plan 画面テキスト（カードラベル、プレースホルダー、判定結果表現） | 遅延ロード |
| build | Build 画面テキスト（推薦結果、カスタマイズ、帰属表示） | 遅延ロード |
