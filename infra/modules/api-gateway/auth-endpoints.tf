# Unit 1: 認証・プロファイル系エンドポイント
#
# POST   /signup
# GET    /profile
# PUT    /profile
# PUT    /disclosure-level
# POST   /mfa/setup
# POST   /mfa/verify
# DELETE /mfa
# POST   /mfa/recovery-codes

locals {
  # ルート直下のリソース（path_part → 定義）
  auth_root_resources = {
    "signup"           = {}
    "profile"          = {}
    "disclosure-level" = {}
    "mfa"              = {}
  }

  # /mfa 配下のサブリソース
  mfa_sub_resources = {
    "setup"          = {}
    "verify"         = {}
    "recovery-codes" = {}
  }

  # メソッド定義: キー → { resource_id, http_method, lambda }
  auth_methods = {
    "signup-post" = {
      resource_id = aws_api_gateway_resource.auth_root["signup"].id
      http_method = "POST"
      lambda      = "signup-handler"
    }
    "profile-get" = {
      resource_id = aws_api_gateway_resource.auth_root["profile"].id
      http_method = "GET"
      lambda      = "get-profile"
    }
    "profile-put" = {
      resource_id = aws_api_gateway_resource.auth_root["profile"].id
      http_method = "PUT"
      lambda      = "put-profile"
    }
    "disclosure-level-put" = {
      resource_id = aws_api_gateway_resource.auth_root["disclosure-level"].id
      http_method = "PUT"
      lambda      = "put-disclosure-level"
    }
    "mfa-delete" = {
      resource_id = aws_api_gateway_resource.auth_root["mfa"].id
      http_method = "DELETE"
      lambda      = "delete-mfa"
    }
    "mfa-setup-post" = {
      resource_id = aws_api_gateway_resource.mfa_sub["setup"].id
      http_method = "POST"
      lambda      = "post-mfa-setup"
    }
    "mfa-verify-post" = {
      resource_id = aws_api_gateway_resource.mfa_sub["verify"].id
      http_method = "POST"
      lambda      = "post-mfa-verify"
    }
    "mfa-recovery-codes-post" = {
      resource_id = aws_api_gateway_resource.mfa_sub["recovery-codes"].id
      http_method = "POST"
      lambda      = "post-recovery-codes"
    }
  }
}

resource "aws_api_gateway_resource" "auth_root" {
  for_each = local.auth_root_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = each.key
}

resource "aws_api_gateway_resource" "mfa_sub" {
  for_each = local.mfa_sub_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.auth_root["mfa"].id
  path_part   = each.key
}

resource "aws_api_gateway_method" "auth" {
  for_each = local.auth_methods

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.resource_id
  http_method   = each.value.http_method
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "auth" {
  for_each = local.auth_methods

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = each.value.resource_id
  http_method             = aws_api_gateway_method.auth[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.auth_lambda_invoke_arns[each.value.lambda]
}
