# API Gateway のアカウントレベル設定
#
# ステージのアクセスログ／実行ログを有効にするには、アカウント単位で
# CloudWatch Logs 書き込み用のロール ARN を登録しておく必要がある。
# 未設定だと aws_api_gateway_stage の作成が
# 「CloudWatch Logs role ARN must be set in account settings」で失敗する。
#
# aws_api_gateway_account はアカウント × リージョンで1つしか存在しない
# シングルトンリソース。dev と prod は同一アカウント・同一リージョンのため、
# 両環境で管理すると互いに上書きし合う。manage_account_setting で
# 片方（dev）だけが管理するようにしている。

resource "aws_iam_role" "apigw_cloudwatch" {
  count = var.manage_account_setting ? 1 : 0

  name = "sdlc-apigw-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
    }]
  })

  tags = {
    Project = "sdlc"
  }
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch" {
  count = var.manage_account_setting ? 1 : 0

  role       = aws_iam_role.apigw_cloudwatch[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  count = var.manage_account_setting ? 1 : 0

  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch[0].arn

  depends_on = [aws_iam_role_policy_attachment.apigw_cloudwatch]
}
