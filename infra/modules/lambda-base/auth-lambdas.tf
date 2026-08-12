# Unit 1: 認証・プロファイル系 Lambda 関数
#
# Unit 1 では IAM ロールとロググループのみが定義されており、
# aws_lambda_function が存在しなかったため一度もデプロイできなかった。
# ここで関数本体を定義する。
#
# コードは deploy-backend.sh が配布する（Terraform はプレースホルダーのみ）。

locals {
  # API Gateway 経由で呼ばれるハンドラー
  auth_lambdas = {
    "signup-handler"       = { role = aws_iam_role.auth_role.arn, timeout = 10, memory = 512 }
    "get-profile"          = { role = aws_iam_role.auth_role.arn, timeout = 10, memory = 256 }
    "put-profile"          = { role = aws_iam_role.auth_role.arn, timeout = 10, memory = 256 }
    "put-disclosure-level" = { role = aws_iam_role.auth_role.arn, timeout = 10, memory = 256 }
    "post-mfa-setup"       = { role = aws_iam_role.mfa_role.arn, timeout = 10, memory = 256 }
    "post-mfa-verify"      = { role = aws_iam_role.mfa_role.arn, timeout = 10, memory = 256 }
    "delete-mfa"           = { role = aws_iam_role.mfa_role.arn, timeout = 10, memory = 256 }
    "post-recovery-codes"  = { role = aws_iam_role.mfa_role.arn, timeout = 10, memory = 256 }
  }

  # 全 Lambda 共通の環境変数
  common_env = {
    USERS_TABLE          = var.users_table_name
    TASTE_PROFILES_TABLE = var.taste_profiles_table_name
    APP_DATA_TABLE       = var.app_data_table_name
    DRINKING_LOGS_TABLE  = var.drinking_logs_table_name
    LOG_LEVEL            = var.env == "prod" ? "INFO" : "DEBUG"
  }
}

resource "aws_lambda_function" "auth" {
  for_each = local.auth_lambdas

  function_name = "sdlc-${each.key}-${var.env}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = each.value.memory
  timeout       = each.value.timeout
  role          = each.value.role

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = merge(local.common_env, {
      POWERTOOLS_SERVICE_NAME = "sdlc-${each.key}"
      # MFA リカバリーコードの HMAC 用（mfa_role のみ利用）
      KMS_RECOVERY_CODES_KEY_ID = aws_kms_key.recovery_codes.key_id
    })
  }

  lifecycle {
    # コードは deploy-backend.sh が更新するため Terraform では追跡しない
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
    Unit        = "foundation"
  }
}

resource "aws_lambda_permission" "auth_apigw" {
  for_each = local.auth_lambdas

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}

# --- Cognito PreSignUp トリガー ---
# for_each の中に入れると Cognito ユーザープールとの間で
# リソース単位の依存が循環しうるため、独立したリソースとして定義する
resource "aws_lambda_function" "presignup" {
  function_name = "sdlc-cognito-pre-signup-trigger-${var.env}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10
  role          = aws_iam_role.presignup_role.arn

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = merge(local.common_env, {
      POWERTOOLS_SERVICE_NAME = "sdlc-cognito-pre-signup-trigger"
    })
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
    Unit        = "foundation"
  }
}

resource "aws_lambda_permission" "presignup_cognito" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presignup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = var.cognito_user_pool_arn
}

# --- Cognito 日次バックアップ（EventBridge スケジュール） ---
resource "aws_lambda_function" "daily_backup" {
  function_name = "sdlc-cognito-daily-backup-${var.env}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 512
  timeout       = 300
  role          = aws_iam_role.backup_role.arn

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = merge(local.common_env, {
      POWERTOOLS_SERVICE_NAME = "sdlc-cognito-daily-backup"
      COGNITO_USER_POOL_ID    = var.cognito_user_pool_id
      BACKUP_BUCKET           = var.backup_bucket_name
    })
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
    Unit        = "foundation"
  }
}

resource "aws_cloudwatch_event_rule" "daily_backup" {
  name                = "sdlc-cognito-daily-backup-${var.env}"
  description         = "Cognito ユーザープールの日次バックアップ"
  schedule_expression = "cron(0 18 * * ? *)" # UTC 18:00 = JST 03:00

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_cloudwatch_event_target" "daily_backup" {
  rule      = aws_cloudwatch_event_rule.daily_backup.name
  target_id = "lambda"
  arn       = aws_lambda_function.daily_backup.arn
}

resource "aws_lambda_permission" "daily_backup_events" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.daily_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_backup.arn
}
