import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { createLogger } from '../../lib/logger';

const logger = createLogger('prompt-seeder');

/**
 * プロンプトシーダー Lambda（Terraform Custom Resource）
 *
 * ライフサイクル:
 * - Create: テンプレートを DynamoDB に投入（Version プロパティの値で）
 * - Update: Version 変更で新バージョンを追加（旧バージョンは残存）
 * - Delete: no-op（テンプレートは削除しない）
 *
 * バージョン採番: Terraform の var.prompt_template_version が唯一の正（Single Source of Truth）
 * プロンプト本文: esbuild バンドルに含まれる prompt-bodies/*.txt を読み込み
 */

interface TemplateConfig {
  templateId: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
  variables: string[];
}

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  _context: Context,
): Promise<{ PhysicalResourceId: string; Data: Record<string, string> }> => {
  const requestType = event.RequestType;
  const version = parseInt(event.ResourceProperties.Version || '1', 10);
  const templates: TemplateConfig[] = JSON.parse(event.ResourceProperties.Templates || '[]');

  logger.info('プロンプトシーダー開始', { requestType, version, templateCount: templates.length });

  if (requestType === 'Delete') {
    logger.info('Delete: no-op（テンプレートは削除しない）');
    return {
      PhysicalResourceId: `prompt-seed-v${version}`,
      Data: { status: 'deleted-noop' },
    };
  }

  // Create / Update: テンプレートを DynamoDB に投入
  const docClient = getDocClient();
  const now = new Date().toISOString();
  let seededCount = 0;

  for (const template of templates) {
    // プロンプト本文をバンドルから読み込み
    const bodyPath = join(__dirname, 'prompt-bodies', `${template.templateId}.txt`);
    let templateBody: string;
    try {
      templateBody = readFileSync(bodyPath, 'utf-8');
    } catch (err) {
      logger.error(`テンプレート本文読み込み失敗: ${template.templateId}`, err as Error);
      continue;
    }

    // DynamoDB に投入（冪等: 同一バージョンは上書き）
    await docClient.send(
      new PutCommand({
        TableName: TableNames.appData(),
        Item: {
          userId: 'SYSTEM',
          dataType: `PROMPT#${template.templateId}#v${version}`,
          templateId: template.templateId,
          version,
          modelId: template.modelId,
          templateBody,
          variables: template.variables,
          maxTokens: template.maxTokens,
          temperature: template.temperature,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    seededCount++;
    logger.info(`テンプレート投入完了: ${template.templateId} v${version}`);
  }

  logger.info('プロンプトシーダー完了', { seededCount, version });

  return {
    PhysicalResourceId: `prompt-seed-v${version}`,
    Data: { status: 'success', seededCount: String(seededCount) },
  };
};
