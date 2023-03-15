import {
    readStacksConfig,
    getRegistryUrl,
    getResourceGroup,
} from '@ensono-stacks/core';
import {
    generateFiles,
    updateProjectConfiguration,
    readProjectConfiguration,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';
import { paramCase, snakeCase } from 'change-case';
import path from 'path';

import { NextGeneratorSchema } from '../schema';
import { setPort } from './common';

export function addTerraform(
    tree: Tree,
    { openTelemetry, project }: NextGeneratorSchema,
) {
    const projectConfig = readProjectConfiguration(tree, project);
    const stacksConfig = readStacksConfig(tree);
    const {
        business: { company, component, domain },
        cloud: { region, platform },
        domain: { internal: internalDomain, external: externalDomain },
        terraform: {
            group: tfGroup,
            storage: tfStorage,
            container: tfContainer,
        },
    } = stacksConfig;

    const namespace = paramCase(component);

    const update = { ...projectConfig };

    const port = setPort(update);

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', platform),
        projectConfig.root,
        {
            projectName: projectConfig.name,
            namespace,
            port,
            devProjectName: paramCase(projectConfig.name),
            prodProjectName: paramCase(projectConfig.name),
            internalDomain,
            externalDomain,
            snakeCase,
            nonProdResourceGroup: getResourceGroup(stacksConfig, 'nonprod'),
            prodResourceGroup: getResourceGroup(stacksConfig, 'prod'),
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
            cwd: `${projectConfig.root}/build/terraform`,
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
            args: `--rg=${tfGroup} --sa=${tfStorage} --container=${tfContainer} --key=${projectConfig.name}:nonprod`,
            cwd: `${projectConfig.root}/build/terraform`,
            parallel: false,
        },
        configurations: {
            prod: {
                args: `--rg=${tfGroup} --sa=${tfStorage} --container=${tfContainer} --key=${projectConfig.name}:prod`,
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
            cwd: `${projectConfig.root}/build/terraform`,
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
                    command: `terraform plan -input=false -lock-timeout=60s {args.terraform} -out=${projectConfig.name}.tfplan`,
                    forwardAllArgs: false,
                },
            ],
            args: '--terraform=-var-file=nonprod.tfvars',
            cwd: `${projectConfig.root}/build/terraform`,
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
                    command: `terraform apply -auto-approve -input=false ${projectConfig.name}.tfplan`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `${projectConfig.root}/build/terraform`,
        },
        configurations: {
            prod: {},
        },
    };

    updateProjectConfiguration(tree, projectConfig.name, update);

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
                inputs: ['terraform'],
                outputs: ['{projectRoot}/build/terraform/*.tfplan'],
            };
        }

        if (!nxJson.targetDefaults['terraform-apply']) {
            updateNxJson.targetDefaults['terraform-apply'] = {
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
