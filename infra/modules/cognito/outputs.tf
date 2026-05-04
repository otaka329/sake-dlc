output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN（IAM ポリシー参照用）"
  value       = aws_cognito_user_pool.main.arn
}

output "client_id" {
  description = "Cognito App Client ID（SPA 用、シークレットなし）"
  value       = aws_cognito_user_pool_client.spa.id
}

output "domain" {
  description = "Cognito ホスティング UI ドメイン"
  value       = aws_cognito_user_pool_domain.main.domain
}
