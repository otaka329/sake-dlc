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
