# Cognito モジュール
# User Pool, App Client, MFA, Pre Sign-up Trigger, Advanced Security

resource "aws_cognito_user_pool" "main" {
  name = "sdlc-user-pool-${var.env}"

  # メールアドレスでログイン
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # NIST SP 800-63B §3.1.1 準拠パスワードポリシー
  # 文字種混合ルール禁止（BR-01-05）
  password_policy {
    minimum_length                   = 15
    require_lowercase                = false
    require_uppercase                = false
    require_numbers                  = false
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # MFA 設定（BR-02B-01: Optional）
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  # Advanced Security（Adaptive Authentication）
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # アカウント復旧（メールのみ）
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # メール設定（Cognito デフォルト）
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Pre Sign-up Lambda Trigger
  lambda_config {
    pre_sign_up = var.pre_signup_lambda_arn
  }

  # スキーマ属性
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# App Client（SPA 用、シークレットなし）
resource "aws_cognito_user_pool_client" "spa" {
  name         = "sdlc-spa-client-${var.env}"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = ["COGNITO"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  # トークン有効期限
  access_token_validity  = 1  # 1時間
  id_token_validity      = 1  # 1時間
  refresh_token_validity = 30 # 30日

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# Cognito ドメイン（ホスティング UI 用）
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "sdlc-${var.env}"
  user_pool_id = aws_cognito_user_pool.main.id
}
