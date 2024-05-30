###
# Variables
###
variable "app_gateway_frontend_ip_name" {
  type = string
}

variable "core_resource_group" {
  type = string
}

variable "dns_a_record_name" {
  type = string
}

variable "dns_a_record_ttl" {
  type    = number
  default = 300
}

variable "dns_zone" {
  type = string
}

variable "dns_zone_rg" {
  type = string
}

###
# Data
###
data "azurerm_dns_zone" "this" {
  name                = var.dns_zone
  resource_group_name = var.dns_zone_rg
}

data "azurerm_public_ip" "application_gateway" {
  name                = var.app_gateway_frontend_ip_name
  resource_group_name = var.core_resource_group
}

###
# Resources
###
resource "azurerm_dns_a_record" "changedforTF" {
  name                = var.dns_a_record_name
  zone_name           = data.azurerm_dns_zone.this.name
  resource_group_name = data.azurerm_dns_zone.this.resource_group_name
  ttl                 = var.dns_a_record_ttl
  records             = [data.azurerm_public_ip.application_gateway.ip_address]
}
