# Unit 2: プロンプトテンプレート シーダー（Terraform Custom Resource）
# Infrastructure Design Q3=A: 既存 lambda-base モジュールに集約

# 初回 apply 用プレースホルダー（空ハンドラー）
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' });"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "prompt_seeder" {
  function_name = "sdlc-prompt-seeder-${var.env}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 60
  role          = aws_iam_role.prompt_seeder_role.arn

  # Lambda 関数コードは deploy-backend.sh で更新。
  # 初回 apply 用に空のプレースホルダー zip を使用（.gitkeep で生成）
  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  environment {
    variables = {
      APP_DATA_TABLE          = var.app_data_table_name
      POWERTOOLS_SERVICE_NAME = "prompt-seeder"
      LOG_LEVEL               = var.env == "prod" ? "INFO" : "DEBUG"
    }
  }

  lifecycle {
    ignore_changes = [filename]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_cloudformation_stack" "prompt_seed" {
  name = "sdlc-prompt-seed-${var.env}"

  template_body = jsonencode({
    Resources = {
      PromptSeed = {
        Type = "Custom::PromptSeed"
        Properties = {
          ServiceToken = aws_lambda_function.prompt_seeder.arn
          Version      = var.prompt_template_version
          Templates    = jsonencode(var.prompt_templates)
        }
      }
    }
  })

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}
