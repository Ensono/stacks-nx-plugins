import { getResourceGroup } from '@ensono-stacks/core';
import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit';

export function updateMainTf(project: ProjectConfiguration, tree: Tree) {
    const update = `
resource "azurerm_redis_cache" "default_primary" {
  name                = var.redis_name
  location            = var.redis_resource_group_location
  resource_group_name = var.redis_resource_group_name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  minimum_tls_version = var.minimum_tls_version
}`;

    const filePath = joinPathFragments(
        project.root,
        '/build/terraform/main.tf',
    );

    // Skip if file doesn't exist
    if (!tree.exists(filePath)) return;

    const mainTF = tree.read(filePath, 'utf-8');

    if (!mainTF.includes(update)) tree.write(filePath, `${mainTF}${update}\n`);
}

export function updateTfVariables(
    project: ProjectConfiguration,
    tree: Tree,
    stacksConfig,
) {
    // Update nonprod variables
    const nonprodResourceGroup = getResourceGroup(stacksConfig, 'nonprod');
    const nonprodUpdate = `
redis_name                    = "${nonprodResourceGroup}"
redis_resource_group_location = "%REPLACE%"
redis_resource_group_name     = "${nonprodResourceGroup}"
  `;
    const nonprodFilePath = joinPathFragments(
        project.root,
        '/build/terraform/nonprod.tfvars',
    );

    // Skip if file doesn't exist
    if (!tree.exists(nonprodFilePath)) return;

    const nonprodFile = tree.read(nonprodFilePath, 'utf-8');

    if (!nonprodFile.includes(nonprodUpdate))
        tree.write(nonprodFilePath, `${nonprodFile}${nonprodUpdate}`);

    // Update prod variables
    const prodResourceGroup = getResourceGroup(stacksConfig, 'prod');
    const prodUpdate = `
redis_name                    = "${prodResourceGroup}"
redis_resource_group_location = "%REPLACE%"
redis_resource_group_name     = "${prodResourceGroup}"
    `;
    const prodFilePath = joinPathFragments(
        project.root,
        '/build/terraform/prod.tfvars',
    );

    // Skip if file doesn't exist
    if (!tree.exists(prodFilePath)) return;

    const prodFile = tree.read(prodFilePath, 'utf-8');

    if (!prodFile.includes(prodUpdate))
        tree.write(prodFilePath, `${prodFile}${prodUpdate}`);
}

export function updateVariablesTf(project: ProjectConfiguration, tree: Tree) {
    const update = `
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
}`;

    const filePath = joinPathFragments(
        project.root,
        '/build/terraform/variables.tf',
    );

    // Skip if file doesn't exist
    if (!tree.exists(filePath)) return;

    const variablesTF = tree.read(filePath, 'utf-8');

    if (!filePath.includes(update))
        tree.write(filePath, `${variablesTF}\n${update}\n`);
}

export function updateOutputsTf(project: ProjectConfiguration, tree: Tree) {
    const update = `output "redis_connection_string" {
  sensitive = true
  value     = "rediss://:\${azurerm_redis_cache.default_primary.primary_access_key}@\${azurerm_redis_cache.default_primary.hostname}:\${azurerm_redis_cache.default_primary.ssl_port}"
}`;

    const filePath = joinPathFragments(
        project.root,
        '/build/terraform/outputs.tf',
    );

    // Skip if file doesn't exist
    if (!tree.exists(filePath)) return;

    const outputsTF = tree.read(filePath, 'utf-8');

    if (!filePath.includes(update))
        tree.write(filePath, `${outputsTF}${update}\n`);
}
