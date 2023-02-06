resource "azurerm_dns_a_record" "<%= snakeCase(projectName) %>" {
  name                = var.dns_a_record_name
  zone_name           = data.azurerm_dns_zone.this.name
  resource_group_name = data.azurerm_dns_zone.this.resource_group_name
  ttl                 = var.dns_a_record_ttl
  records             = var.dns_a_record_records
}
