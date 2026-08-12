output "common_layer_arn" {
  description = "共通 Lambda Layer ARN（Powertools, Zod, pino）"
  value       = aws_lambda_layer_version.common.arn
}

output "auth_role_arn" {
  description = "認証ハンドラー用 IAM ロール ARN"
  value       = aws_iam_role.auth_role.arn
}

output "mfa_role_arn" {
  description = "MFA ハンドラー用 IAM ロール ARN"
  value       = aws_iam_role.mfa_role.arn
}

output "presignup_role_arn" {
  description = "Cognito Pre Sign-up Trigger 用 IAM ロール ARN"
  value       = aws_iam_role.presignup_role.arn
}

output "backup_role_arn" {
  description = "Cognito 日次バックアップ用 IAM ロール ARN"
  value       = aws_iam_role.backup_role.arn
}

output "recovery_codes_kms_key_arn" {
  description = "MFA リカバリーコード HMAC 用 KMS キー ARN"
  value       = aws_kms_key.recovery_codes.arn
}

output "recovery_codes_kms_key_id" {
  description = "MFA リカバリーコード HMAC 用 KMS キー ID（Lambda 環境変数用）"
  value       = aws_kms_key.recovery_codes.key_id
}

# Unit 2: AI Lambda invoke ARNs
output "ai_lambda_invoke_arns" {
  description = "AI Lambda 関数の invoke ARN マップ（API Gateway 統合用）"
  value       = { for k, v in aws_lambda_function.ai : k => v.invoke_arn }
}

output "prompt_seeder_role_arn" {
  description = "プロンプトシーダー用 IAM ロール ARN"
  value       = aws_iam_role.prompt_seeder_role.arn
}

output "ai_role_arn" {
  description = "AI ハンドラー用 IAM ロール ARN"
  value       = aws_iam_role.ai_role.arn
}
