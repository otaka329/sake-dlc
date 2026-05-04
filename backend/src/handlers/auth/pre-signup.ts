import type { PreSignUpTriggerEvent, Context } from 'aws-lambda';
import { createLogger } from '../../lib/logger';

const logger = createLogger('cognito-pre-signup-trigger');

/**
 * Cognito Pre Sign-up Lambda Trigger
 *
 * AWS 仕様上、Pre Sign-up Trigger にはパスワードが渡されないため、
 * パスワードのブロックリスト照合（BR-01-07: HaveIBeenPwned、辞書、コンテキスト）は
 * フロントエンドで実施する方針に変更。
 *
 * このトリガーでは以下のみ実行:
 * - ソーシャルログイン時の自動確認制御
 * - 将来的な拡張ポイント（IP ベースのブロック等）
 *
 * ブロックリスト照合の実装箇所:
 * - HaveIBeenPwned k-anonymity チェック: フロントエンド（SignupPage.tsx）
 * - カスタム辞書チェック: フロントエンド（SignupPage.tsx）
 * - コンテキスト固有チェック: フロントエンド（SignupPage.tsx）
 * - サーバーサイド再検証: POST /signup ハンドラー内（将来実装検討）
 */
export const handler = async (
  event: PreSignUpTriggerEvent,
  _context: Context,
): Promise<PreSignUpTriggerEvent> => {
  logger.info('Pre Sign-up Trigger 開始', {
    triggerSource: event.triggerSource,
    userPoolId: event.userPoolId,
  });

  // ソーシャルログイン（External Provider）の場合
  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    // メール自動確認（ソーシャルプロバイダーが検証済み）
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    logger.info('ソーシャルログイン: 自動確認有効');
  }

  logger.info('Pre Sign-up Trigger 完了');
  return event;
};
