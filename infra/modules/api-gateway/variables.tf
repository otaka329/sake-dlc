variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "allowed_origin" {
  description = "CORS 許可オリジン"
  type        = string
}

variable "lambda_invoke_arns" {
  description = "Lambda 関数の invoke ARN マップ"
  type        = map(string)
  default     = {}
}
