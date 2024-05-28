module "redis" {
  count   = var.create_redis ? 1 : 0
  source  = "claranet/redis/azurerm"
  version = "7.8.1"

  # Overrides Claranet Name Generator
  custom_name = var.custom_name ? "${module.default_label.id}-redis" : null

  # Required (For Data Blocks and other local generated variables)
  resource_group_name   = var.resource_group_name
  location              = var.location
  location_short        = local.location_short_key
  client_name           = var.name_company
  environment           = var.name_environment
  stack                 = var.name_project
  logs_destinations_ids = var.logs_destinations_ids

  # Optional
  sku_name                      = "Basic"
  capacity                      = 1 # Description: Redis size: (Basic/Standard: 1,2,3,4,5,6) (Premium: 1,2,3,4)
  public_network_access_enabled = true
  allow_non_ssl_connections     = true # Description: Activate non SSL port (6379) for Redis connection

  # Please read the Claranet & Terraform.io documentation to decide what variables you wish to provide
  redis_additional_configuration = {
    active_directory_authentication_enabled = var.active_directory_authentication_enabled
    aof_backup_enabled                      = var.aof_backup_enabled
    aof_storage_connection_string_0         = var.aof_storage_connection_string_0
    aof_storage_connection_string_1         = var.aof_storage_connection_string_1
    enable_authentication                   = var.enable_authentication
    maxfragmentationmemory_reserved         = var.maxfragmentationmemory_reserved
    maxmemory_delta                         = var.maxmemory_delta
    maxmemory_policy                        = var.maxmemory_policy
    maxmemory_reserved                      = var.maxmemory_reserved
    notify_keyspace_events                  = var.notify_keyspace_events
    rdb_backup_enabled                      = var.rdb_backup_enabled
    rdb_backup_frequency                    = var.rdb_backup_frequency
    rdb_backup_max_snapshot_count           = var.rdb_backup_max_snapshot_count
    rdb_storage_connection_string           = var.rdb_storage_connection_string
  }
}
