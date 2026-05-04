# Lambda 基盤モジュール
# 共通 Layer, IAM ロール（最小権限）, ロググループ

# --- 共通 Lambda Layer ---
resource "aws_lambda_layer_version" "common" {
  layer_name          = "sdlc-common-layer-${var.env}"
  compatible_runtimes = ["nodejs22.x"]
  filename            = "${path.module}/layers/common-layer.zip"
  source_code_hash    = filebase64sha256("${path.module}/layers/common-layer.zip")
  description         = "Powertools, Zod, pino 共通依存"
}

# --- IAM ロール: 認証ハンドラー（SECURITY-06: 最小権限）---
resource "aws_iam_role" "auth_role" {
  name = "sdlc-auth-role-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_iam_role_policy" "auth_dynamodb" {
  name = "auth-dynamodb-policy"
  role = aws_iam_role.auth_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
        ]
        Resource = [
          var.users_table_arn,
          "${var.users_table_arn}/index/*",
          var.taste_profiles_table_arn,
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:UpdateItem"]
        Resource = [var.app_data_table_arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "auth_basic" {
  role       = aws_iam_role.auth_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "auth_xray" {
  role       = aws_iam_role.auth_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# --- IAM ロール: MFA ハンドラー ---
resource "aws_iam_role" "mfa_role" {
  name = "sdlc-mfa-role-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_iam_role_policy" "mfa_dynamodb" {
  name = "mfa-dynamodb-policy"
  role = aws_iam_role.mfa_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:UpdateItem", "dynamodb:GetItem"]
        Resource = [var.users_table_arn]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:GenerateMac"]
        Resource = [var.kms_recovery_codes_key_arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "mfa_basic" {
  role       = aws_iam_role.mfa_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "mfa_xray" {
  role       = aws_iam_role.mfa_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# --- IAM ロール: Pre Sign-up Trigger ---
resource "aws_iam_role" "presignup_role" {
  name = "sdlc-presignup-role-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_iam_role_policy_attachment" "presignup_basic" {
  role       = aws_iam_role.presignup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- IAM ロール: Cognito 日次バックアップ ---
resource "aws_iam_role" "backup_role" {
  name = "sdlc-backup-role-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_iam_role_policy" "backup_cognito_s3" {
  name = "backup-cognito-s3-policy"
  role = aws_iam_role.backup_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["cognito-idp:ListUsers", "cognito-idp:AdminGetUser"]
        Resource = [var.cognito_user_pool_arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = ["${var.backup_bucket_arn}/cognito-backups/*"]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup_basic" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- CloudWatch ロググループ（Lambda 用）---
# SECURITY-14: ログ保持（dev: 30日, prod: 180日）
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "signup-handler",
    "get-profile",
    "put-profile",
    "put-disclosure-level",
    "post-mfa-setup",
    "post-mfa-verify",
    "delete-mfa",
    "post-recovery-codes",
    "cognito-pre-signup-trigger",
    "cognito-daily-backup",
  ])

  name              = "/aws/lambda/sdlc-${each.key}-${var.env}"
  retention_in_days = var.log_retention_days

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}
