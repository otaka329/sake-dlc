variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "users_table_arn" {
  type = string
}

variable "taste_profiles_table_arn" {
  type = string
}

variable "app_data_table_arn" {
  type = string
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "backup_bucket_arn" {
  type = string
}

variable "log_retention_days" {
  description = "CloudWatch ログ保持日数（dev: 30, prod: 180）"
  type        = number
}
