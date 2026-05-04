import fc from 'fast-check';

/**
 * パスワードジェネレーター（PBT-07 準拠）
 * NIST SP 800-63B §3.1.1 準拠/非準拠のパスワードを生成
 */

/** NIST 準拠パスワード（15文字以上、印刷可能 ASCII + Unicode） */
export const validPasswordArb = fc.string({ minLength: 15, maxLength: 64 }).filter(
  (s) => s.trim().length >= 15, // 空白のみは除外
);

/** NIST 非準拠パスワード（14文字以下） */
export const tooShortPasswordArb = fc.string({ minLength: 1, maxLength: 14 });

/** 空パスワード */
export const emptyPasswordArb = fc.constant('');
