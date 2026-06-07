/**
 * 料理カテゴリ enum（BR-15-02 統一定義）
 * 8カテゴリ + フォールバック値 other
 * 使用箇所: DishInput.category, cache-manager.ts normalizeDishes, dish-suggestions.ts
 */
export const DISH_CATEGORIES = [
  'sashimi',
  'grilled_fish',
  'simmered',
  'fried',
  'meat',
  'vegetable',
  'nabe',
  'dessert',
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];

export const DISH_CATEGORIES_WITH_OTHER = [...DISH_CATEGORIES, 'other'] as const;
export type DishCategoryWithOther = (typeof DISH_CATEGORIES_WITH_OTHER)[number];

/**
 * 料理カテゴリの日本語/英語ラベル
 */
export const DISH_CATEGORY_LABELS: Record<DishCategoryWithOther, { ja: string; en: string }> = {
  sashimi: { ja: '刺身・寿司', en: 'Sashimi & Sushi' },
  grilled_fish: { ja: '焼き魚', en: 'Grilled Fish' },
  simmered: { ja: '煮物', en: 'Simmered Dishes' },
  fried: { ja: '揚げ物', en: 'Fried Dishes' },
  meat: { ja: '肉料理', en: 'Meat Dishes' },
  vegetable: { ja: '野菜料理', en: 'Vegetable Dishes' },
  nabe: { ja: '鍋物', en: 'Hot Pot' },
  dessert: { ja: 'デザート', en: 'Dessert' },
  other: { ja: 'その他', en: 'Other' },
};
