module "default_label" {
  source     = "git::https://github.com/cloudposse/terraform-null-label.git?ref=0.25.0"
  namespace  = "${var.name_company}-${var.name_project}"
  stage      = var.name_environment
  name       = "${lookup(var.location_name_map, var.location, "uksouth")}-${var.name_domain}"
  attributes = var.attributes
  delimiter  = "-"
}
