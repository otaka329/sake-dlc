variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "log_retention_days" {
  description = "S3 ログの保持日数（dev: 30, prod: 180）"
  type        = number
}
