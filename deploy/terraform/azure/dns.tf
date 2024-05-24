###
# Data
###
data "azurerm_dns_zone" "default" {
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
resource "azurerm_dns_a_record" "stacks_app" {
  name                = var.dns_a_record_name
  zone_name           = data.azurerm_dns_zone.default.name
  resource_group_name = data.azurerm_dns_zone.default.resource_group_name
  ttl                 = var.dns_a_record_ttl
  records             = [data.azurerm_public_ip.application_gateway.ip_address]
}
