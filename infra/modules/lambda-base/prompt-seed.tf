# Unit 2: プロンプトテンプレート シーダー
#
# 当初は CloudFormation Custom Resource（Custom::PromptSeed）で
# terraform apply 中に投入する設計だったが、以下の理由で取りやめた:
#   - apply 時点の Lambda にはプレースホルダーコードしか載っておらず、
#     Custom Resource の応答プロトコルを満たせずに1時間ハングする
#   - 実コードは deploy-backend.sh が apply の「後」に配るため順序が逆転する
# 現在は deploy-backend.sh がコード配布後に aws lambda invoke で起動する。
# テンプレート定義とバージョンは環境変数として渡す。

# 初回 apply 用プレースホルダー（実コードは deploy-backend.sh が配布）
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

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  layers = [aws_lambda_layer_version.common.arn]

  environment {
    variables = {
      APP_DATA_TABLE          = var.app_data_table_name
      POWERTOOLS_SERVICE_NAME = "prompt-seeder"
      LOG_LEVEL               = var.env == "prod" ? "INFO" : "DEBUG"
      # シーダー起動時に参照する。var.prompt_template_version が採番の唯一の正
      PROMPT_TEMPLATE_VERSION = var.prompt_template_version
      PROMPT_TEMPLATES        = jsonencode(var.prompt_templates)
    }
  }

  lifecycle {
    # コードは deploy-backend.sh が更新するため、Terraform では追跡しない
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}
