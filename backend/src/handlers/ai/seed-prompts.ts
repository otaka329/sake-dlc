import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { createLogger } from '../../lib/logger';

// プロンプト本文は esbuild の text loader でバンドルに埋め込む。
// 実行時 readFileSync は使わない（ESM に __dirname がなく、zip にも .txt が入らないため）
import recommendBody from './prompt-bodies/recommend.txt';
import dontDeployBody from './prompt-bodies/dont-deploy.txt';
import alternativeProposalBody from './prompt-bodies/alternative-proposal.txt';
import metaResponseBody from './prompt-bodies/meta-response.txt';

const logger = createLogger('prompt-seeder');

/**
 * プロンプトシーダー Lambda
 *
 * deploy-backend.sh が実コード配布後に aws lambda invoke で起動する。
 * Terraform の CloudFormation Custom Resource ではない：
 * terraform apply の時点では Lambda にプレースホルダーコードしか載っておらず、
 * Custom Resource が応答できずに1時間ハングするため、その方式は採用しない。
 *
 * バージョン採番: Terraform の var.prompt_template_version が唯一の正
 * （PROMPT_TEMPLATE_VERSION 環境変数として渡る）
 * 冪等性: 同一 templateId × 同一バージョンへの再実行は上書きになる
 */

interface TemplateConfig {
  templateId: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
  variables: string[];
}

const TEMPLATE_BODIES: Record<string, string> = {
  recommend: recommendBody,
  'dont-deploy': dontDeployBody,
  'alternative-proposal': alternativeProposalBody,
  'meta-response': metaResponseBody,
};

export interface SeedResult {
  version: number;
  seeded: string[];
  skipped: string[];
}

export const handler = async (): Promise<SeedResult> => {
  const version = parseInt(process.env.PROMPT_TEMPLATE_VERSION || '1', 10);
  const templates: TemplateConfig[] = JSON.parse(process.env.PROMPT_TEMPLATES || '[]');

  logger.info('プロンプトシーダー開始', { version, templateCount: templates.length });

  const docClient = getDocClient();
  const now = new Date().toISOString();
  const seeded: string[] = [];
  const skipped: string[] = [];

  for (const template of templates) {
    const templateBody = TEMPLATE_BODIES[template.templateId];
    if (!templateBody) {
      logger.error('テンプレート本文が見つかりません', { templateId: template.templateId });
      skipped.push(template.templateId);
      continue;
    }

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

    seeded.push(template.templateId);
    logger.info('テンプレート投入完了', { templateId: template.templateId, version });
  }

  logger.info('プロンプトシーダー完了', { version, seededCount: seeded.length, skippedCount: skipped.length });

  if (skipped.length > 0) {
    throw new Error(`テンプレート本文が見つからないものがあります: ${skipped.join(', ')}`);
  }

  return { version, seeded, skipped };
};
