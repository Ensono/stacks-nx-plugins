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