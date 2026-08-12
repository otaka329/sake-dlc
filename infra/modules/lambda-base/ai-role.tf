# Unit 2: AI Core — IAM ロール

# sdlc-ai-role（recommend, dont-deploy, meta-response Lambda 用）
resource "aws_iam_role" "ai_role" {
  name = "sdlc-ai-role-${var.env}"

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

resource "aws_iam_role_policy" "ai_bedrock" {
  name = "ai-bedrock-policy"
  role = aws_iam_role.ai_role.id

  # H2: 利用する2モデルIDに限定（ワイルドカード不使用）
  # デプロイ前チェックリストで東京オンデマンド可否を確認し、
  # 必要に応じて推論プロファイル ARN に差し替え
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["bedrock:InvokeModel"]
        Resource = [
          "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy" "ai_dynamodb" {
  name = "ai-dynamodb-policy"
  role = aws_iam_role.ai_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"]
        Resource = [var.app_data_table_arn, "${var.app_data_table_arn}/index/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem"]
        Resource = [var.users_table_arn, var.taste_profiles_table_arn, var.sakenowa_cache_table_arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ai_basic" {
  role       = aws_iam_role.ai_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "ai_xray" {
  role       = aws_iam_role.ai_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# sdlc-prompt-seeder-role（Custom Resource Lambda 用）
resource "aws_iam_role" "prompt_seeder_role" {
  name = "sdlc-prompt-seeder-role-${var.env}"

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

resource "aws_iam_role_policy" "prompt_seeder_dynamodb" {
  name = "prompt-seeder-dynamodb-policy"
  role = aws_iam_role.prompt_seeder_role.id

  # L1: PK=SYSTEM のみに制限
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:Query"]
        Resource = [var.app_data_table_arn]
        Condition = {
          "ForAllValues:StringEquals" = {
            "dynamodb:LeadingKeys" = ["SYSTEM"]
          }
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "prompt_seeder_basic" {
  role       = aws_iam_role.prompt_seeder_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
