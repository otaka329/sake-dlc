output "rest_api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "stage_invoke_url" {
  description = "API Gateway ステージの呼び出し URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "authorizer_id" {
  description = "Cognito JWT Authorizer ID（リソース定義時に参照）"
  value       = aws_api_gateway_authorizer.cognito.id
}
