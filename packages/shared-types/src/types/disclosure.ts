import type { DisclosureLevel, UnlockCategory } from '../schemas/user';

/**
 * 開示レイヤーの状態
 */
export interface DisclosureState {
  /** 現在の開示レイヤー（1: 感覚・感情軸、2: カテゴリ・産地軸、3: 専門軸） */
  disclosureLevel: DisclosureLevel;
  /** Layer 2 個別解放済みカテゴリ */
  unlockedCategories: UnlockCategory[];
}

/**
 * 指定レイヤーが表示可能かどうかを判定
 * disclosureLevel >= requiredLayer であれば表示可能
 */
export function isLayerVisible(state: DisclosureState, requiredLayer: DisclosureLevel): boolean {
  return state.disclosureLevel >= requiredLayer;
}

/**
 * 指定カテゴリが解放済みかどうかを判定
 * Layer 2 以上、または unlockedCategories に含まれていれば解放済み
 */
export function isCategoryUnlocked(state: DisclosureState, category: UnlockCategory): boolean {
  return state.disclosureLevel >= 2 || state.unlockedCategories.includes(category);
}

/**
 * 6軸 TasteProfile → 2軸（甘辛×濃淡）マッピング（Layer 1 用）
 *
 * 甘辛軸: (f1_hanayaka + f2_houjun - f5_dry - f6_keikai) / 4 + 0.5
 *   → 0.0(辛い) 〜 1.0(甘い)
 * 濃淡軸: (f2_houjun + f3_juukou - f4_odayaka - f6_keikai) / 4 + 0.5
 *   → 0.0(さっぱり) 〜 1.0(濃厚)
 */
export interface TwoAxisProfile {
  /** 甘辛軸: 0.0(辛い) 〜 1.0(甘い) */
  sweetDry: number;
  /** 濃淡軸: 0.0(さっぱり) 〜 1.0(濃厚) */
  lightRich: number;
}

export interface SixAxisProfile {
  f1: number; // 華やか
  f2: number; // 芳醇
  f3: number; // 重厚
  f4: number; // 穏やか
  f5: number; // ドライ
  f6: number; // 軽快
}

/**
 * 6軸 → 2軸マッピング
 * 出力は [0.0, 1.0] の範囲にクランプ
 */
export function mapToTwoAxis(profile: SixAxisProfile): TwoAxisProfile {
  const sweetDry = Math.max(0, Math.min(1, (profile.f1 + profile.f2 - profile.f5 - profile.f6) / 4 + 0.5));
  const lightRich = Math.max(0, Math.min(1, (profile.f2 + profile.f3 - profile.f4 - profile.f6) / 4 + 0.5));
  return { sweetDry, lightRich };
}
