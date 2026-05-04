variable "env" {
  default = "dev"
}

variable "sns_alert_email" {
  description = "アラート通知先メールアドレス"
  type        = string
}
