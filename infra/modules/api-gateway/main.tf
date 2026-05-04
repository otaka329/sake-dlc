# API Gateway モジュール
# REST API, Cognito Authorizer, スロットリング, Gateway Response 7種, CORS

resource "aws_api_gateway_rest_api" "main" {
  name        = "sdlc-api-${var.env}"
  description = "SDLC — Sake Driven Life Cycle API (${var.env})"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# Cognito Authorizer（SECURITY-08）
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
  identity_source = "method.request.header.Authorization"
}

# ステージ設定（スロットリング + アクセスログ）
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.env

  # X-Ray トレーシング
  xray_tracing_enabled = true

  # ステージ変数
  variables = {
    allowed_origin = var.allowed_origin
  }

  # SECURITY-02: アクセスログ
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# ステージレベルスロットリング（500 req/sec, バースト 1000）
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = 500
    throttling_burst_limit = 1000
    logging_level          = var.env == "prod" ? "ERROR" : "INFO"
    metrics_enabled        = true
  }
}

# アクセスログ用 CloudWatch ロググループ
resource "aws_cloudwatch_log_group" "api_access_logs" {
  name              = "/aws/apigateway/sdlc-api-${var.env}"
  retention_in_days = var.env == "prod" ? 180 : 30

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# --- Gateway Response 7種（カスタム JSON 形式統一）---

resource "aws_api_gateway_gateway_response" "unauthorized" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "UNAUTHORIZED"
  status_code   = "401"

  response_templates = {
    "application/json" = jsonencode({ code = "AUTH_ERROR", message = "認証が必要です" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "access_denied" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "ACCESS_DENIED"
  status_code   = "403"

  response_templates = {
    "application/json" = jsonencode({ code = "FORBIDDEN", message = "アクセスが拒否されました" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "request_too_large" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "REQUEST_TOO_LARGE"
  status_code   = "413"

  response_templates = {
    "application/json" = jsonencode({ code = "VALIDATION_ERROR", message = "リクエストサイズが上限を超えています" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "throttled" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "THROTTLED"
  status_code   = "429"

  response_templates = {
    "application/json" = jsonencode({ code = "RATE_LIMITED", message = "リクエスト数が上限を超えています" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "integration_timeout" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "INTEGRATION_TIMEOUT"
  status_code   = "504"

  response_templates = {
    "application/json" = jsonencode({ code = "INTERNAL_ERROR", message = "サーバーが応答しませんでした" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_templates = {
    "application/json" = jsonencode({ code = "AUTH_ERROR", message = "リクエストエラー" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_templates = {
    "application/json" = jsonencode({ code = "INTERNAL_ERROR", message = "サーバーエラー" })
  }
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origin}'"
  }
}

# デプロイメント（リソース追加時に再作成）
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_gateway_response.unauthorized,
      aws_api_gateway_gateway_response.access_denied,
      aws_api_gateway_gateway_response.request_too_large,
      aws_api_gateway_gateway_response.throttled,
      aws_api_gateway_gateway_response.integration_timeout,
      aws_api_gateway_gateway_response.default_4xx,
      aws_api_gateway_gateway_response.default_5xx,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}
