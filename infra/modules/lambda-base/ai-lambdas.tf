# Unit 2: AI Core — Lambda 関数3本

locals {
  ai_lambdas = {
    "post-recommend"     = { timeout = 20, memory = 512 }
    "post-dont-deploy"   = { timeout = 10, memory = 512 }
    "post-meta-response" = { timeout = 10, memory = 512 }
  }
}

resource "aws_lambda_function" "ai" {
  for_each = local.ai_lambdas

  function_name = "sdlc-${each.key}-${var.env}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = each.value.memory
  timeout       = each.value.timeout
  role          = aws_iam_role.ai_role.arn

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      BEDROCK_REGION              = "ap-northeast-1"
      AI_GATEWAY_DRY_RUN          = var.env == "prod" ? "false" : "true"
      RECOMMEND_DAILY_LIMIT       = "3"
      RECOMMEND_CACHE_TTL_SECONDS = "3600"
      APP_DATA_TABLE              = var.app_data_table_name
      USERS_TABLE                 = var.users_table_name
      TASTE_PROFILES_TABLE        = var.taste_profiles_table_name
      SAKENOWA_CACHE_TABLE        = var.sakenowa_cache_table_name
      LOG_LEVEL                   = var.env == "prod" ? "INFO" : "DEBUG"
      POWERTOOLS_SERVICE_NAME     = "sdlc-${each.key}"
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
    Unit        = "ai-core"
  }
}

# CloudWatch ロググループ
resource "aws_cloudwatch_log_group" "ai_lambda_logs" {
  for_each = local.ai_lambdas

  name              = "/aws/lambda/sdlc-${each.key}-${var.env}"
  retention_in_days = var.log_retention_days

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# API Gateway → Lambda 呼び出し許可
resource "aws_lambda_permission" "ai_apigw" {
  for_each = local.ai_lambdas

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}
