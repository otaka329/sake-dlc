# prod 環境 — モジュール呼び出し

module "dynamodb" {
  source = "../../modules/dynamodb"
  env    = var.env
}

module "cognito" {
  source                = "../../modules/cognito"
  env                   = var.env
  pre_signup_lambda_arn = module.lambda_base.presignup_lambda_arn
  callback_urls         = ["https://CLOUDFRONT_DOMAIN/callback"] # デプロイ後に更新
  logout_urls           = ["https://CLOUDFRONT_DOMAIN/login"]
}

module "api_gateway" {
  source                = "../../modules/api-gateway"
  env                   = var.env
  cognito_user_pool_arn = module.cognito.user_pool_arn
  allowed_origin        = "https://CLOUDFRONT_DOMAIN" # デプロイ後に更新
  # Unit 2: AI Core
  lambda_invoke_arns      = module.lambda_base.ai_lambda_invoke_arns
  auth_lambda_invoke_arns = module.lambda_base.auth_lambda_invoke_arns
}

module "s3_cloudfront" {
  source             = "../../modules/s3-cloudfront"
  env                = var.env
  log_retention_days = 180
}

module "lambda_base" {
  source                   = "../../modules/lambda-base"
  env                      = var.env
  users_table_arn          = module.dynamodb.users_table_arn
  taste_profiles_table_arn = module.dynamodb.taste_profiles_table_arn
  app_data_table_arn       = module.dynamodb.app_data_table_arn
  cognito_user_pool_arn    = module.cognito.user_pool_arn
  backup_bucket_arn        = module.s3_cloudfront.logs_bucket_arn
  log_retention_days       = 180
  # Unit 2: AI Core
  sakenowa_cache_table_arn  = module.dynamodb.sakenowa_cache_table_arn
  app_data_table_name       = module.dynamodb.app_data_table_name
  users_table_name          = module.dynamodb.users_table_name
  taste_profiles_table_name = module.dynamodb.taste_profiles_table_name
  sakenowa_cache_table_name = module.dynamodb.sakenowa_cache_table_name
  api_execution_arn         = module.api_gateway.rest_api_execution_arn
  # Unit 1: 認証系 Lambda
  drinking_logs_table_name = module.dynamodb.drinking_logs_table_name
  cognito_user_pool_id     = module.cognito.user_pool_id
  backup_bucket_name       = module.s3_cloudfront.logs_bucket_name
  prompt_template_version  = "1"
  prompt_templates = [
    { templateId = "recommend", modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0", maxTokens = 2000, temperature = 0.7, variables = ["dishes", "mood", "tasteProfile", "flavorData", "disclosureLevel", "locale"] },
    { templateId = "dont-deploy", modelId = "anthropic.claude-3-haiku-20240307-v1:0", maxTokens = 500, temperature = 0.3, variables = ["conditionScore", "sleepHours", "tomorrowSchedule", "mood"] },
    { templateId = "alternative-proposal", modelId = "anthropic.claude-3-haiku-20240307-v1:0", maxTokens = 500, temperature = 0.7, variables = ["season", "mood", "locale"] },
    { templateId = "meta-response", modelId = "anthropic.claude-3-haiku-20240307-v1:0", maxTokens = 300, temperature = 0.5, variables = ["userMessage", "locale"] },
  ]
}

module "monitoring" {
  source          = "../../modules/monitoring"
  env             = var.env
  sns_alert_email = var.sns_alert_email
  api_name        = "sdlc-api-${var.env}"
}

# --- Outputs ---
output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "api_invoke_url" {
  value = module.api_gateway.stage_invoke_url
}

output "cloudfront_domain" {
  value = module.s3_cloudfront.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  value = module.s3_cloudfront.cloudfront_distribution_id
}

output "frontend_bucket" {
  value = module.s3_cloudfront.frontend_bucket_name
}
