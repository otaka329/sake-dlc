output "users_table_name" {
  description = "Users テーブル名（Lambda 環境変数用）"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "Users テーブル ARN（IAM ポリシー参照用）"
  value       = aws_dynamodb_table.users.arn
}

output "taste_profiles_table_name" {
  description = "TasteProfiles テーブル名（Lambda 環境変数用）"
  value       = aws_dynamodb_table.taste_profiles.name
}

output "taste_profiles_table_arn" {
  description = "TasteProfiles テーブル ARN（IAM ポリシー参照用）"
  value       = aws_dynamodb_table.taste_profiles.arn
}

output "drinking_logs_table_name" {
  description = "DrinkingLogs テーブル名（Lambda 環境変数用）"
  value       = aws_dynamodb_table.drinking_logs.name
}

output "drinking_logs_table_arn" {
  description = "DrinkingLogs テーブル ARN（IAM ポリシー参照用）"
  value       = aws_dynamodb_table.drinking_logs.arn
}

output "sakenowa_cache_table_name" {
  description = "SakenowaCache テーブル名（Lambda 環境変数用）"
  value       = aws_dynamodb_table.sakenowa_cache.name
}

output "sakenowa_cache_table_arn" {
  description = "SakenowaCache テーブル ARN（IAM ポリシー参照用）"
  value       = aws_dynamodb_table.sakenowa_cache.arn
}

output "app_data_table_name" {
  description = "AppData テーブル名（Lambda 環境変数用）"
  value       = aws_dynamodb_table.app_data.name
}

output "app_data_table_arn" {
  description = "AppData テーブル ARN（IAM ポリシー参照用）"
  value       = aws_dynamodb_table.app_data.arn
}
