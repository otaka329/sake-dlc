# dev 環境 — モジュール呼び出し

module "dynamodb" {
  source = "../../modules/dynamodb"
  env    = var.env
}

module "cognito" {
  source                = "../../modules/cognito"
  env                   = var.env
  pre_signup_lambda_arn = "" # Lambda デプロイ後に設定
  callback_urls         = ["https://localhost:5173/callback"]
  logout_urls           = ["https://localhost:5173/login"]
}

module "api_gateway" {
  source                = "../../modules/api-gateway"
  env                   = var.env
  cognito_user_pool_arn = module.cognito.user_pool_arn
  allowed_origin        = "http://localhost:5173"
}

module "s3_cloudfront" {
  source             = "../../modules/s3-cloudfront"
  env                = var.env
  log_retention_days = 30
}

module "lambda_base" {
  source                  = "../../modules/lambda-base"
  env                     = var.env
  users_table_arn         = module.dynamodb.users_table_arn
  taste_profiles_table_arn = module.dynamodb.taste_profiles_table_arn
  app_data_table_arn      = module.dynamodb.app_data_table_arn
  cognito_user_pool_arn   = module.cognito.user_pool_arn
  backup_bucket_arn           = module.s3_cloudfront.logs_bucket_arn
  kms_recovery_codes_key_arn  = "" # KMS キー作成後に設定
  log_retention_days          = 30
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
