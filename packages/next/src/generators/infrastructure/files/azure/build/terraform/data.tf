data "azurerm_client_config" "current" {}

data "azurerm_dns_zone" "this" {
  name                = var.dns_zone
  resource_group_name = var.dns_zone_rg
}

data "azurerm_public_ip" "application_gateway" {
  name                = var.app_gateway_frontend_ip_name
  resource_group_name = var.core_resource_group
}