output "redis_capacity" {
  description = "Redis capacity"
  value       = module.redis.redis_capacity
}

output "redis_configuration" {
  description = "Redis configuration"
  value       = module.redis.redis_configuration
}

output "redis_family" {
  description = "Redis family"
  value       = module.redis.redis_family
}

output "redis_hostname" {
  description = "Redis instance hostname"
  value       = module.redis.redis_hostname
}

output "redis_id" {
  description = "Redis instance id"
  value       = module.redis.redis_id
}

output "redis_name" {
  description = "Redis instance name"
  value       = module.redis.redis_name
}

output "redis_port" {
  description = "Redis instance port"
  value       = module.redis.redis_port
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = module.redis.redis_primary_access_key
}

output "redis_primary_connection_string" {
  description = "The primary connection string of the Redis Instance."
  value       = module.redis.redis_primary_connection_string
}

output "redis_private_static_ip_address" {
  description = "Redis private static IP address"
  value       = module.redis.redis_private_static_ip_address
}

output "redis_secondary_access_key" {
  description = "Redis secondary access key"
  value       = module.redis.redis_secondary_access_key
}

output "redis_secondary_connection_string" {
  description = "The secondary connection string of the Redis Instance."
  value       = module.redis.redis_secondary_connection_string
}

output "redis_sku_name" {
  description = "Redis SKU name"
  value       = module.redis.redis_sku_name
}

output "redis_ssl_port" {
  description = "Redis instance SSL port"
  value       = module.redis.redis_ssl_port
}

output "terraform_module" {
  description = "Information about this Terraform module"
  value       = module.redis.terraform_module
}
