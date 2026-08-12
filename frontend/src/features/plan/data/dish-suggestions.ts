import type { DishCategory } from '@sdlc/shared-types';

/**
 * 料理サジェスト静的リスト（BR-15）
 * 8カテゴリ × 代表料理 3〜5件
 */

export interface DishSuggestion {
  category: DishCategory;
  labelJa: string;
  labelEn: string;
  dishes: Array<{ ja: string; en: string }>;
}

export const DISH_SUGGESTIONS: DishSuggestion[] = [
  {
    category: 'sashimi',
    labelJa: '刺身・寿司',
    labelEn: 'Sashimi & Sushi',
    dishes: [
      { ja: '刺身盛り合わせ', en: 'Assorted sashimi' },
      { ja: 'マグロ刺身', en: 'Tuna sashimi' },
      { ja: '握り寿司', en: 'Nigiri sushi' },
      { ja: 'しめ鯖', en: 'Marinated mackerel' },
    ],
  },
  {
    category: 'grilled_fish',
    labelJa: '焼き魚',
    labelEn: 'Grilled Fish',
    dishes: [
      { ja: '鮭の塩焼き', en: 'Salt-grilled salmon' },
      { ja: 'さんまの塩焼き', en: 'Grilled saury' },
      { ja: '鯛の塩焼き', en: 'Grilled sea bream' },
    ],
  },
  {
    category: 'simmered',
    labelJa: '煮物',
    labelEn: 'Simmered Dishes',
    dishes: [
      { ja: '金目鯛の煮付け', en: 'Simmered red snapper' },
      { ja: '肉じゃが', en: 'Meat and potato stew' },
      { ja: '筑前煮', en: 'Chikuzen-ni' },
      { ja: 'おでん', en: 'Oden' },
    ],
  },
  {
    category: 'fried',
    labelJa: '揚げ物',
    labelEn: 'Fried Dishes',
    dishes: [
      { ja: '天ぷら', en: 'Tempura' },
      { ja: 'とんかつ', en: 'Tonkatsu' },
      { ja: '唐揚げ', en: 'Karaage' },
      { ja: 'エビフライ', en: 'Fried shrimp' },
    ],
  },
  {
    category: 'meat',
    labelJa: '肉料理',
    labelEn: 'Meat Dishes',
    dishes: [
      { ja: '焼き鳥', en: 'Yakitori' },
      { ja: 'すき焼き', en: 'Sukiyaki' },
      { ja: 'しゃぶしゃぶ', en: 'Shabu-shabu' },
      { ja: 'ステーキ', en: 'Steak' },
    ],
  },
  {
    category: 'vegetable',
    labelJa: '野菜料理',
    labelEn: 'Vegetable Dishes',
    dishes: [
      { ja: '枝豆', en: 'Edamame' },
      { ja: '冷やしトマト', en: 'Chilled tomato' },
      { ja: 'ほうれん草のおひたし', en: 'Blanched spinach' },
    ],
  },
  {
    category: 'nabe',
    labelJa: '鍋物',
    labelEn: 'Hot Pot',
    dishes: [
      { ja: '寄せ鍋', en: 'Yosenabe' },
      { ja: 'もつ鍋', en: 'Motsu nabe' },
      { ja: '湯豆腐', en: 'Yudofu' },
      { ja: 'ちゃんこ鍋', en: 'Chanko nabe' },
    ],
  },
  {
    category: 'dessert',
    labelJa: 'デザート',
    labelEn: 'Dessert',
    dishes: [
      { ja: 'チーズ盛り合わせ', en: 'Cheese platter' },
      { ja: 'チョコレート', en: 'Chocolate' },
      { ja: 'フルーツ', en: 'Fruit' },
    ],
  },
];
