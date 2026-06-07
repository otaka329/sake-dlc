import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { PromptTemplate } from '@sdlc/shared-types';
import { getDocClient, TableNames } from '../dynamodb';
import { InternalError } from '../errors';
import { createLogger } from '../logger';

const logger = createLogger('template-manager');

/**
 * プロンプトテンプレート管理
 * BL-16: DynamoDB AppData (PK: SYSTEM) から最新バージョンを取得
 * BR-14-04: 取得失敗時は InternalError（Fail-closed）
 */

/**
 * テンプレート最新バージョンを取得
 * Query: PK=SYSTEM, SK begins_with("PROMPT#{templateId}#v"), 降順, Limit 1
 */
export async function getTemplate(templateId: string): Promise<PromptTemplate> {
  const docClient = getDocClient();

  const result = await docClient.send(
    new QueryCommand({
      TableName: TableNames.appData(),
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
      ExpressionAttributeNames: {
        '#pk': 'userId', // AppData の PK 列名は userId（SYSTEM スコープでも同じ属性名を使用）
        '#sk': 'dataType',
      },
      ExpressionAttributeValues: {
        ':pk': 'SYSTEM',
        ':skPrefix': `PROMPT#${templateId}#v`,
      },
      ScanIndexForward: false, // 降順（最新バージョンが先頭）
      Limit: 1,
    }),
  );

  if (!result.Items || result.Items.length === 0) {
    logger.error('テンプレート取得失敗（Fail-closed）', { templateId });
    throw new InternalError(`プロンプトテンプレート "${templateId}" が見つかりません`);
  }

  const item = result.Items[0];
  return {
    templateId: item.templateId as string,
    version: item.version as number,
    modelId: item.modelId as string,
    templateBody: item.templateBody as string,
    variables: item.variables as string[],
    maxTokens: item.maxTokens as number,
    temperature: item.temperature as number,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
  };
}

/**
 * テンプレート変数を置換
 * {{variableName}} → 対応する値に置換
 * BR-13-05: 未置換プレースホルダーが残っていればエラー
 * L1: ユーザー入力値に含まれる {{...}} はサニタイズ（エスケープ）してから埋め込み
 */
export function substituteVariables(
  templateBody: string,
  variables: Record<string, unknown>,
): string {
  let result = templateBody;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    let replacement = typeof value === 'string' ? value : JSON.stringify(value);
    // ユーザー入力から {{...}} パターンをエスケープ（未置換検出の誤発火防止）
    replacement = replacement.replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }');
    result = result.replaceAll(placeholder, replacement);
  }

  // 未置換プレースホルダー検出（BR-13-05）
  const remaining = result.match(/\{\{[^}]+\}\}/g);
  if (remaining) {
    logger.error('テンプレート変数の置換漏れ', { remaining });
    throw new InternalError(`プロンプトテンプレートに未置換変数があります: ${remaining.join(', ')}`);
  }

  return result;
}
