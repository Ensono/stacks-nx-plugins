locals {
  location_short_key = lookup(var.location_name_map, lower(var.location), "unknown")
}
