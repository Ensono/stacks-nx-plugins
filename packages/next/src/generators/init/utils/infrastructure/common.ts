/* eslint-disable no-template-curly-in-string */
import { readStacksConfig } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    generateFiles,
    offsetFromRoot,
    updateJson,
    updateProjectConfiguration,
    ProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import { paramCase } from 'change-case';
import path from 'path';

import {
    JSCUTLERY_SEMVER_VERSION,
    NXTOOLS_NX_CONTAINER_VERSION,
    NXTOOLS_NX_METADATA_VERSION,
} from '../constants';
import { getRegistryUrl } from './registry';

function addCommonInfrastructureDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@nx-tools/nx-container': NXTOOLS_NX_CONTAINER_VERSION,
            '@nx-tools/container-metadata': NXTOOLS_NX_METADATA_VERSION,
            '@jscutlery/semver': JSCUTLERY_SEMVER_VERSION,
        },
    );
}

export function addCommon(tree: Tree, project: ProjectConfiguration) {
    const stacksConfig = readStacksConfig(tree);
    const namespace = paramCase(
        `${stacksConfig.business.domain}-${stacksConfig.business.component}`,
    );

    const customServer =
        project.targets?.['build-custom-server']?.options?.main;

    const distFolderPath = project.targets?.build?.options?.outputPath;
    const rootFolderPath = project.targets?.build?.options?.root;
    const port = project.targets?.serve.options.port || 4200;

    let customServerRelativePath: string;

    if (customServer) {
        customServerRelativePath = customServer
            .replace(rootFolderPath, '')
            .replace('.ts', '.js');
    }

    const registryPaths = {
        nonprod: getRegistryUrl(stacksConfig, 'nonprod'),
        prod: getRegistryUrl(stacksConfig, 'prod'),
    };

    generateFiles(
        tree,
        path.join(__dirname, '..', '..', 'files', 'infrastructure', 'common'),
        project.root,
        {
            distFolderPath,
            customServerRelativePath,
            port,
            projectName: project.name,
            namespace,
            internalDomain: stacksConfig.domain.internal,
        },
    );

    const update = { ...project };

    update.targets.container = {
        executor: '@nx-tools/nx-container:build',
        options: {
            engine: 'docker',
            load: true,
            platforms: ['linux/amd64'],
            metadata: {
                images: [`${namespace}/${project.name}`],
                tags: [],
            },
        },
        configurations: {
            nonprod: {
                load: false,
                push: true,
                metadata: {
                    tags: [
                        `${registryPaths.nonprod}/${namespace}/${project.name}:latest`,
                        `${registryPaths.nonprod}/${namespace}/${project.name}` +
                            ':${version}',
                    ],
                },
                tags: [
                    `${registryPaths.nonprod}/${namespace}/${project.name}:latest`,
                    `${registryPaths.nonprod}/${namespace}/${project.name}` +
                        ':${version}',
                ],
            },
            prod: {
                load: false,
                push: true,
                metadata: {
                    tags: [
                        `${registryPaths.prod}/${namespace}/${project.name}:latest`,
                        `${registryPaths.prod}/${namespace}/${project.name}` +
                            ':${version}',
                    ],
                },
                tags: [
                    `${registryPaths.prod}/${namespace}/${project.name}:latest`,
                    `${registryPaths.prod}/${namespace}/${project.name}` +
                        ':${version}',
                ],
            },
        },
    };

    update.targets.version = {
        executor: '@jscutlery/semver:version',
        options: {
            preset: 'conventional',
            trackDeps: true,
            skipCommit: true,
            dryRun: true,
            skipRootChangelog: true,
            skipProjectChangelog: true,
        },
        configurations: {
            nonprod: {
                dryRun: false,
                noVerify: true,
                push: true,
                postTargets: [
                    `${project.name}:container:nonprod`,
                    `${project.name}:helm-package`,
                    `${project.name}:helm-push`,
                ],
            },
            prod: {
                dryRun: false,
                noVerify: true,
                push: true,
                postTargets: [
                    `${project.name}:container:prod`,
                    `${project.name}:helm-package`,
                    `${project.name}:helm-push:prod`,
                ],
            },
        },
    };

    update.targets['helm-install'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `helm install ${project.name} oci://${registryPaths.nonprod}/helm/${project.name} -n ${namespace} --atomic --set serviceAccount.annotations."azure\\.workload\\.identity/client-id"="{args.clientid}" --set serviceAccount.annotations."azure\\.workload\\.identity/tenant-id"="{args.tenantid}"`,
                    forwardAllArgs: false,
                },
            ],
        },
        configurations: {
            prod: {
                commands: [
                    {
                        command: `helm install ${project.name} oci://${registryPaths.prod}/helm/${project.name} -n ${namespace} --atomic --set serviceAccount.annotations."azure\\.workload\\.identity/client-id"="{args.clientid}" --set serviceAccount.annotations."azure\\.workload\\.identity/tenant-id"="{args.tenantid}"`,
                        forwardAllArgs: false,
                    },
                ],
            },
        },
    };

    update.targets['helm-lint'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: 'helm lint',
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/helm`,
        },
    };

    update.targets['helm-test'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `helm test ${project.name}`,
                    forwardAllArgs: false,
                },
            ],
        },
    };

    update.targets['helm-package'] = {
        executor: 'nx:run-commands',
        options: {
            command: 'echo Runs in CI only',
            forwardAllArgs: false,
        },
        configurations: {
            ci: {
                command:
                    // eslint-disable-next-line prefer-template
                    'helm package . --version ${version} --app-version ${version} -u -d ' +
                    offsetFromRoot(`dist/${project.root}/build/helm`),
                forwardAllArgs: false,
                cwd: `${project.root}/build/helm`,
            },
        },
    };

    update.targets['helm-push'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `helm push ${project.name}*.tgz oci://${registryPaths.nonprod}/helm`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `dist/${project.root}/build/helm`,
        },
        configurations: {
            prod: {
                commands: [
                    {
                        command: `helm push ${project.name}*.tgz oci://${registryPaths.prod}/helm`,
                        forwardAllArgs: false,
                    },
                ],
            },
        },
    };

    if (stacksConfig.vcs.type === 'github') {
        update.targets.github = {
            executor: '@jscutlery/semver:github',
            options: {
                tag: '${tag}',
                notes: '${notes}',
            },
        };

        update.targets.version.configurations.nonprod.postTargets.push(
            `${project.name}:github`,
        );
        update.targets.version.configurations.prod.postTargets.push(
            `${project.name}:github`,
        );
    }

    updateProjectConfiguration(tree, project.name, update);

    updateJson(tree, 'nx.json', nxJson => {
        const updateNxJson = { ...nxJson };

        updateNxJson.tasksRunnerOptions.default.options.cacheableOperations = [
            ...new Set([
                ...nxJson.tasksRunnerOptions.default.options
                    .cacheableOperations,
                'container',
                'helm-lint',
                'helm-package',
            ]),
        ];

        if (!nxJson.targetDefaults.container) {
            updateNxJson.targetDefaults.container = {
                dependsOn: ['build'],
                inputs: ['container'],
            };
        }

        if (!nxJson.targetDefaults['helm-lint']) {
            updateNxJson.targetDefaults['helm-lint'] = {
                inputs: ['helm'],
            };
        }

        if (!nxJson.targetDefaults['helm-package']) {
            updateNxJson.targetDefaults['helm-package'] = {
                inputs: ['helm'],
                outputs: [
                    '{workspaceRoot}/dist/{projectRoot}/build/helm/*.tgz',
                ],
            };
        }

        if (!nxJson.targetDefaults['helm-push']) {
            updateNxJson.targetDefaults['helm-push'] = {
                dependsOn: ['helm-package'],
                inputs: ['helm'],
            };
        }

        updateNxJson.namedInputs.default = [
            ...new Set([
                ...nxJson.namedInputs.default,
                '!{projectRoot}/Dockerfile',
                '!{projectRoot}/Chart.yaml',
                '!{projectRoot}/values.yaml',
                '!{projectRoot}/charts/**/*',
                '!{projectRoot}/templates/**/*',
            ]),
        ];

        if (!updateNxJson.namedInputs.container) {
            updateNxJson.namedInputs.container = ['{projectRoot}/Dockerfile'];
        }

        if (!updateNxJson.namedInputs.helm) {
            updateNxJson.namedInputs.helm = ['{projectRoot}/build/helm/**/*'];
        }

        return updateNxJson;
    });

    return addCommonInfrastructureDependencies(tree);
}
