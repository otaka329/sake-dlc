import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import type { ZodSchema } from 'zod';
import type { AuthContext } from '@sdlc/shared-types';
import { ZodError } from 'zod';
import { createLogger, maskPii } from '../lib/logger';
import { createTracer } from '../lib/tracer';
import { createMetrics, MetricUnit } from '../lib/metrics';
import { AppError, ValidationError, InternalError } from '../lib/errors';
import { error as errorResponse } from '../lib/response';
import { checkRateLimit } from './rate-limiter';

/**
 * Lambda ハンドラー共通ラッパー
 *
 * ミドルウェアスタック:
 * 1. Powertools Logger（correlationId 自動付与、PII マスク）
 * 2. Powertools Tracer（X-Ray トレーシング）
 * 3. Powertools Metrics（カスタムメトリクス）
 * 4. JWT 検証（Cognito Authorizer 後の userId 抽出）
 * 5. レート制限（DynamoDB アトミック演算）
 * 6. Zod 入力バリデーション
 * 7. ビジネスロジック
 * 8. グローバルエラーハンドラー（Fail-closed）
 */

interface HandlerOptions<T> {
  /** Zod バリデーションスキーマ（リクエストボディ用） */
  schema?: ZodSchema<T>;
  /** サービス名（ログ・メトリクス用） */
  serviceName: string;
  /** レート制限をスキップするか（Pre Sign-up Trigger 等） */
  skipRateLimit?: boolean;
}

type HandlerFunction<T> = (
  event: APIGatewayProxyEvent,
  context: Context,
  auth: AuthContext,
  body: T,
) => Promise<APIGatewayProxyResult>;

/**
 * 共通ハンドラーラッパーを生成
 * SECURITY-03: 構造化ログ
 * SECURITY-05: 入力バリデーション
 * SECURITY-08: トークン検証（userId 抽出）
 * SECURITY-09, 15: エラーハンドリング（Fail-closed）
 * SECURITY-11: レート制限
 */
export function createHandler<T = unknown>(
  options: HandlerOptions<T>,
  handler: HandlerFunction<T>,
) {
  const logger = createLogger(options.serviceName);
  const tracer = createTracer(options.serviceName);
  const metrics = createMetrics(options.serviceName);

  return async (
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> => {
    // correlationId をリクエスト ID から設定
    logger.addContext(context);
    logger.appendKeys({
      correlationId: event.requestContext?.requestId,
    });

    const segment = tracer.getSegment();
    const subsegment = segment?.addNewSubsegment(`## ${options.serviceName}`);

    try {
      // JWT から userId を抽出（SECURITY-08）
      const claims = event.requestContext?.authorizer?.claims;
      if (!claims?.sub || !claims?.email) {
        logger.warn('認証情報が不足しています');
        return errorResponse(
          { code: 'AUTH_ERROR', message: '認証が必要です' },
          401,
        );
      }

      const auth: AuthContext = {
        userId: claims.sub as string,
        email: claims.email as string,
      };

      logger.appendKeys({ userId: auth.userId });

      // レート制限チェック（SECURITY-11）
      if (!options.skipRateLimit) {
        await checkRateLimit(auth.userId, logger);
      }

      // リクエストボディのバリデーション（SECURITY-05）
      let body = {} as T;
      if (options.schema && event.body) {
        try {
          const parsed = JSON.parse(event.body);
          body = options.schema.parse(parsed);
        } catch (err) {
          if (err instanceof ZodError) {
            const details = err.errors.map((e) => ({
              field: e.path.join('.'),
              reason: e.message,
            }));
            throw new ValidationError('入力内容に問題があります', details);
          }
          if (err instanceof SyntaxError) {
            throw new ValidationError('リクエストボディの形式が不正です');
          }
          throw err;
        }
      }

      // ビジネスロジック実行
      logger.info('リクエスト処理開始', {
        method: event.httpMethod,
        path: event.path,
      });

      const startTime = Date.now();
      const result = await handler(event, context, auth, body);
      const duration = Date.now() - startTime;

      // メトリクス送出
      metrics.addMetric('ApiLatency', MetricUnit.Milliseconds, duration);
      metrics.addDimension('endpoint', event.path);
      metrics.addDimension('method', event.httpMethod);
      metrics.publishStoredMetrics();

      logger.info('リクエスト処理完了', { duration, statusCode: result.statusCode });

      return result;
    } catch (err) {
      // グローバルエラーハンドラー（SECURITY-09, 15: Fail-closed）
      if (err instanceof AppError) {
        logger.warn('アプリケーションエラー', {
          errorCode: err.code,
          statusCode: err.statusCode,
          ...maskPii({ message: err.message }),
        });

        const metricName =
          err.statusCode === 400 ? 'ValidationErrorCount' :
          err.statusCode === 429 ? 'RateLimitCount' :
          'AppErrorCount';
        metrics.addMetric(metricName, MetricUnit.Count, 1);
        metrics.publishStoredMetrics();

        return errorResponse(err.toResponse(), err.statusCode);
      }

      // 未知のエラー（500 + 汎用メッセージ、スタックトレースはログのみ）
      const internalErr = new InternalError();
      logger.error('予期しないエラー', err as Error);

      metrics.addMetric('ErrorCount', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      return errorResponse(internalErr.toResponse(), 500);
    } finally {
      subsegment?.close();
    }
  };
}
