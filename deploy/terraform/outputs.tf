# Conditional outputs for Redis
output "redis_capacity" {
  description = "Redis capacity"
  value       = one(module.redis[*].redis_capacity)
}

output "redis_configuration" {
  description = "Redis configuration"
  value       = one(module.redis[*].redis_configuration)
  sensitive   = true
}

output "redis_family" {
  description = "Redis family"
  value       = one(module.redis[*].redis_family)
}


output "redis_hostname" {
  description = "Redis instance hostname"
  value       = one(module.redis[*].redis_hostname)
}

output "redis_id" {
  description = "Redis instance id"
  value       = one(module.redis[*].redis_id)
}

output "redis_name" {
  description = "Redis instance name"
  value       = one(module.redis[*].redis_name)
}

output "redis_port" {
  description = "Redis instance port"
  value       = one(module.redis[*].redis_port)
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = one(module.redis[*].redis_primary_access_key)
  sensitive   = true
}

output "redis_primary_connection_string" {
  description = "The primary connection string of the Redis Instance."
  value       = one(module.redis[*].redis_primary_connection_string)
  sensitive   = true
}

output "redis_private_static_ip_address" {
  description = "Redis private static IP address"
  value       = one(module.redis[*].redis_private_static_ip_address)
}

# output "redis_secondary_access_key" {
#   description = "Redis secondary access key"
#   value       = one(module.redis[*].redis_secondary_access_key)
#   sensitive = true
# }

# output "redis_secondary_connection_string" {
#   description = "The secondary connection string of the Redis Instance."
#   value       = one(module.redis[*].redis_secondary_connection_string)
#   sensitive = true
# }

output "redis_sku_name" {
  description = "Redis SKU name"
  value       = one(module.redis[*].redis_sku_name)
}

output "redis_ssl_port" {
  description = "Redis instance SSL port"
  value       = one(module.redis[*].redis_ssl_port)
}
