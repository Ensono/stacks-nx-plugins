###
# Variables
###
variable "minimum_tls_version" {
  type    = string
  default = "1.2"
}

variable "redis_capacity" {
  type    = string
  default = "1"
}

variable "redis_family" {
  type    = string
  default = "C"
}

variable "redis_name" {
  type = string
}

variable "redis_resource_group_name" {
  type = string
}


variable "redis_resource_group_location" {
  type = string
}

variable "redis_sku_name" {
  type    = string
  default = "Standard"
}

###
# Resources
###
resource "azurerm_redis_cache" "default_primary" {
  name                = var.redis_name
  location            = var.redis_resource_group_location
  resource_group_name = var.redis_resource_group_name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  minimum_tls_version = var.minimum_tls_version
}

###
# Outputs
###
output "redis_connection_string" {
  sensitive = true
  value     = "redis://${azurerm_redis_cache.default_primary.primary_access_key}@${azurerm_redis_cache.default_primary.hostname}:${azurerm_redis_cache.default_primary.ssl_port}"
}