/* eslint-disable no-template-curly-in-string */
import { readStacksConfig, getRegistryUrl } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    generateFiles,
    offsetFromRoot,
    updateJson,
    updateProjectConfiguration,
    readProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import { paramCase } from 'change-case';
import path from 'path';

import {
    JSCUTLERY_SEMVER_VERSION,
    NXTOOLS_NX_CONTAINER_VERSION,
    NXTOOLS_NX_METADATA_VERSION,
} from '../../../utils/constants';
import { NextGeneratorSchema } from '../schema';

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

export function setPort(project) {
    return project.targets?.serve.options.port || 4200;
}

export function addCommon(tree: Tree, options: NextGeneratorSchema) {
    const stacksConfig = readStacksConfig(tree);
    const project = readProjectConfiguration(tree, options.project);

    const customServer =
        project.targets?.['build-custom-server']?.options?.main;

    const distFolderPath = project.targets?.build?.options?.outputPath;
    const rootFolderPath = project.targets?.build?.options?.root;

    const port = setPort(project);

    let customServerRelativePath: string;

    if (customServer) {
        customServerRelativePath = customServer
            .replace(rootFolderPath, '')
            .replace('.ts', '.js');
    }

    const {
        business: { company, domain, component },
        cloud: { region },
        vcs: { type: vcsType },
    } = stacksConfig;

    const domainPrefix = paramCase(`${company}-${domain}`);
    const namespace = paramCase(component);
    const domainEnv = {
        nonprod: paramCase(`${domainPrefix}-nonprod-${region}-core`),
        prod: paramCase(`${domainPrefix}-prod-${region}-core`),
    };
    const registryPaths = {
        nonprod: getRegistryUrl(stacksConfig, 'nonprod'),
        prod: getRegistryUrl(stacksConfig, 'prod'),
    };

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', 'common'),
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
                preid: 'nonprod',
                releaseAs: 'prerelease',
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

    update.targets['helm-upgrade'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `helm upgrade --devel --create-namespace --install ${project.name} oci://${registryPaths.nonprod}/helm/${project.name} -n ${namespace} --atomic --wait --kube-context ${domainEnv.nonprod}-admin --set serviceAccount.annotations."azure\\.workload\\.identity/client-id"="{args.clientid}" --set serviceAccount.annotations."azure\\.workload\\.identity/tenant-id"="{args.tenantid}"`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/terraform`,
        },
        configurations: {
            prod: {
                commands: [
                    {
                        command: `helm upgrade --create-namespace --install --values values-prod.yaml ${project.name} oci://${registryPaths.prod}/helm/${project.name} -n ${namespace} --atomic --wait --kube-context ${domainEnv.prod}-admin --set serviceAccount.annotations."azure\\.workload\\.identity/client-id"="{args.clientid}" --set serviceAccount.annotations."azure\\.workload\\.identity/tenant-id"="{args.tenantid}"`,
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
            commands: [
                {
                    command:
                        // eslint-disable-next-line prefer-template
                        'helm package . --version ${version} --app-version ${version} -u -d ' +
                        offsetFromRoot(`${project.root}/build/helm`) +
                        `dist/${project.root}/build/helm`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `${project.root}/build/helm`,
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

    if (vcsType === 'github') {
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

        updateNxJson.namedInputs = updateNxJson.namedInputs || {};

        if (!nxJson.targetDefaults.version) {
            updateNxJson.targetDefaults.version = {
                dependsOn: ['build'],
            };
        }

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
                ...(nxJson.namedInputs?.default || []),
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
