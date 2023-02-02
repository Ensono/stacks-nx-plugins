import { readStacksConfig } from '@ensono-stacks/core';
import {
    generateFiles,
    updateProjectConfiguration,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';
import { paramCase } from 'change-case';
import path from 'path';

import { getRegistryUrl } from './registry';

export function addTerraform(tree: Tree, project: ProjectConfiguration) {
    const stacksConfig = readStacksConfig(tree);
    const namespace = paramCase(
        `${stacksConfig.business.domain}-${stacksConfig.business.component}`,
    );

    const update = { ...project };

    generateFiles(
        tree,
        path.join(
            __dirname,
            '..',
            '..',
            'files',
            'infrastructure',
            stacksConfig.cloud.platform,
        ),
        project.root,
        {
            projectName: project.name,
            namespace,
            nonprodRegistryPath: `${getRegistryUrl(
                stacksConfig,
                'nonprod',
            )}/${namespace}/${project.name}`,
            prodRegistryPath: `${getRegistryUrl(
                stacksConfig,
                'prod',
            )}/${namespace}/${project.name}`,
            devProjectName: paramCase(`nonprod-${project.name}`),
            prodProjectName: paramCase(`prod-${project.name}`),
            cloudGroup: stacksConfig.cloud.group,
            internalDomain: stacksConfig.domain.internal,
            externalDomain: stacksConfig.domain.external,
        },
    );

    update.targets['terraform-fmt'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: 'terraform fmt -check -diff',
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/terraform`,
            parallel: false,
        },
    };

    update.targets['terraform-init'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command:
                        'terraform init -lock-timeout=60s -input=false -backend-config="resource_group_name={args.rg}" -backend-config="storage_account_name={args.sa}" -backend-config="container_name={args.container}" -backend-config="key={args.key}"',
                    forwardAllArgs: false,
                },
            ],
            args: `--rg=${stacksConfig.cloud.group} --sa=${stacksConfig.terraform.storage} --container=${stacksConfig.terraform.container} --key=${project.name}:nonprod`,
            cwd: `${project.root}/build/terraform`,
            parallel: false,
        },
        configurations: {
            prod: {
                args: `--rg=${stacksConfig.cloud.group} --sa=${stacksConfig.terraform.storage} --container=${stacksConfig.terraform.container} --key=${project.name}:prod`,
            },
        },
    };

    update.targets['terraform-validate'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: 'terraform validate',
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/terraform`,
            parallel: false,
        },
    };

    update.targets['terraform-plan'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: 'terraform validate',
                    forwardAllArgs: false,
                },
                {
                    command: `terraform plan -input=false -lock-timeout=60s {args.terraform} -out=${project.name}.tfplan`,
                    forwardAllArgs: false,
                },
            ],
            args: '--terraform=-var-file=nonprod.tfvars',
            cwd: `${project.root}/build/terraform`,
            parallel: false,
        },
        configurations: {
            prod: {
                args: '--terraform=-var-file=prod.tfvars',
            },
        },
    };

    update.targets['terraform-apply'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `terraform apply -auto-approve -input=false ${project.name}.tfplan`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/terraform`,
        },
    };

    updateProjectConfiguration(tree, project.name, update);

    updateJson(tree, 'nx.json', nxJson => {
        const updateNxJson = { ...nxJson };

        updateNxJson.tasksRunnerOptions.default.options.cacheableOperations = [
            ...new Set([
                ...nxJson.tasksRunnerOptions.default.options
                    .cacheableOperations,
                'terraform-fmt',
                'terraform-init',
                'terraform-validate',
                'terraform-plan',
                'terraform-apply',
            ]),
        ];

        if (!nxJson.targetDefaults['terraform-fmt']) {
            updateNxJson.targetDefaults['terraform-fmt'] = {
                inputs: ['terraform'],
            };
        }

        if (!nxJson.targetDefaults['terraform-init']) {
            updateNxJson.targetDefaults['terraform-init'] = {
                inputs: ['terraform'],
                outputs: [
                    '{projectRoot}/build/terraform/.terraform',
                    '{projectRoot}/build/terraform/.terraform.lock.hcl',
                ],
            };
        }

        if (!nxJson.targetDefaults['terraform-validate']) {
            updateNxJson.targetDefaults['terraform-validate'] = {
                dependsOn: ['terraform-init'],
                inputs: ['terraform'],
            };
        }

        if (!nxJson.targetDefaults['terraform-plan']) {
            updateNxJson.targetDefaults['terraform-plan'] = {
                dependsOn: ['terraform-init'],
                inputs: ['terraform'],
                outputs: ['{projectRoot}/build/terraform/*.tfplan'],
            };
        }

        if (!nxJson.targetDefaults['terraform-apply']) {
            updateNxJson.targetDefaults['terraform-apply'] = {
                dependsOn: ['terraform-plan'],
                inputs: ['terraform'],
            };
        }

        if (!nxJson.namedInputs.terraform) {
            updateNxJson.namedInputs.terraform = [
                '{projectRoot}/build/terraform/*.tf',
                '{projectRoot}/build/terraform/*.tfvars',
                '{projectRoot}/build/terraform/.terraform.lock.hcl',
            ];
        }

        return updateNxJson;
    });

    return () => {};
}
