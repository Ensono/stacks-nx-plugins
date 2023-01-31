data "azurerm_client_config" "current" {}

data "azurerm_dns_zone" "this" {
  name                = var.dns_zone
  resource_group_name = var.dns_zone_rg
}
