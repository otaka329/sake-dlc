import { createHash } from 'crypto';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { DishInput, DisclosureLevel } from '@sdlc/shared-types';
import type { SixAxisProfile } from '@sdlc/shared-types';
import { getDocClient, TableNames } from '../dynamodb';
import { createLogger } from '../logger';

const logger = createLogger('cache-manager');

/**
 * レスポンスキャッシュ管理
 * ハイブリッド: 推薦のみキャッシュ（判定/メタ応答はキャッシュなし）
 * NFR Design §2: 入力正規化でヒット率50%を目標
 */

const CACHE_TTL_SECONDS = parseInt(process.env.RECOMMEND_CACHE_TTL_SECONDS || '3600', 10);

// --- 入力正規化（F2: ヒット率50%のためのキー正規化） ---

/**
 * 料理名 → カテゴリに正規化（BR-15 の 8カテゴリ + other）
 * サジェスト経由の場合は category が付与済み。自由入力はキーワードマッチで推定。
 */
function normalizeDishes(dishes: DishInput[]): string[] {
  return dishes
    .map((d) => d.category || 'other')
    .sort();
}

/**
 * 気分テキスト → 5バケットに正規化
 */
function normalizeMood(mood: string): string {
  const lower = mood.trim().toLowerCase();
  if (/元気|嬉しい|happy|good|楽しい/.test(lower)) return 'happy';
  if (/疲|tired|だるい|眠い/.test(lower)) return 'tired';
  if (/祝|celebrate|特別|記念/.test(lower)) return 'celebrate';
  if (/まったり|relax|のんびり|ゆっくり/.test(lower)) return 'relax';
  return 'neutral';
}

/**
 * TasteProfile → 0.1刻みに量子化
 */
function quantizeProfile(profile: SixAxisProfile): SixAxisProfile {
  const q = (v: number) => Math.round(v * 10) / 10;
  return { f1: q(profile.f1), f2: q(profile.f2), f3: q(profile.f3), f4: q(profile.f4), f5: q(profile.f5), f6: q(profile.f6) };
}

/**
 * キャッシュキー生成（SHA-256 先頭16文字）
 */
export function generateCacheKey(
  userId: string,
  dishes: DishInput[],
  mood: string,
  tasteProfile: SixAxisProfile,
  disclosureLevel: DisclosureLevel,
  locale: string,
): string {
  const input = JSON.stringify({
    userId,
    dishes: normalizeDishes(dishes),
    mood: normalizeMood(mood),
    tasteProfile: quantizeProfile(tasteProfile),
    disclosureLevel,
    locale,
  });
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}

/**
 * キャッシュ読み込み
 * TTL 手動チェック（DynamoDB TTL 削除遅延を考慮）
 */
export async function getCachedResponse(userId: string, cacheKey: string): Promise<string | null> {
  const docClient = getDocClient();

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TableNames.appData(),
        Key: { userId, dataType: `AI_CACHE#${cacheKey}` },
      }),
    );

    if (!result.Item) return null;

    // TTL 手動チェック
    const ttl = result.Item.ttl as number;
    if (ttl < Math.floor(Date.now() / 1000)) {
      return null; // 期限切れ
    }

    return result.Item.data as string;
  } catch (err) {
    logger.warn('キャッシュ読み込み失敗（スキップ）', { error: (err as Error).message });
    return null;
  }
}

/**
 * キャッシュ書き込み
 */
export async function setCachedResponse(userId: string, cacheKey: string, data: string): Promise<void> {
  const docClient = getDocClient();
  const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS;

  try {
    await docClient.send(
      new PutCommand({
        TableName: TableNames.appData(),
        Item: {
          userId,
          dataType: `AI_CACHE#${cacheKey}`,
          data,
          ttl,
        },
      }),
    );
  } catch (err) {
    logger.warn('キャッシュ書き込み失敗（スキップ）', { error: (err as Error).message });
  }
}
