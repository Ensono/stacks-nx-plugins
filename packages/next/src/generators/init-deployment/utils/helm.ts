/* eslint-disable no-template-curly-in-string */
import { readStacksConfig, getRegistryUrl } from '@ensono-stacks/core';
import { addProjectConfiguration, Tree } from '@nx/devkit';

import { NextGeneratorSchema } from '../schema';

export function addHelmProject(
    tree: Tree,
    options: NextGeneratorSchema,
    helmProjectName: string,
    helmProjectPath: string,
) {
    const stacksConfig = readStacksConfig(tree);

    const helmProjectTargets = {};

    const nonprodRegistryPath = `${getRegistryUrl(
        stacksConfig,
        'nonprod',
    )}/helm`;
    const prodRegistryPath = `${getRegistryUrl(stacksConfig, 'prod')}/helm`;

    helmProjectTargets['version'] = {
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
                    `${helmProjectName}:helm-package`,
                    `${helmProjectName}:helm-push`,
                ],
            },
            prod: {
                dryRun: false,
                noVerify: true,
                push: true,
                postTargets: [
                    `${helmProjectName}:helm-package`,
                    `${helmProjectName}:helm-push:prod`,
                ],
            },
        },
    };

    helmProjectTargets['lint'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: 'helm lint',
                    forwardAllArgs: false,
                },
            ],
            cwd: `${helmProjectPath}/build/helm`,
        },
    };

    helmProjectTargets['helm-package'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command:
                        'helm package build/helm --version ${version} -u -d dist',
                    forwardAllArgs: false,
                },
            ],
            cwd: helmProjectPath,
        },
    };

    helmProjectTargets['helm-push'] = {
        executor: 'nx:run-commands',
        options: {
            commands: [
                {
                    command: `helm push ${helmProjectName}-\${version}.tgz oci://${nonprodRegistryPath}`,
                    forwardAllArgs: false,
                },
            ],
            cwd: `${helmProjectPath}/dist`,
        },
        configurations: {
            prod: {
                commands: [
                    {
                        command: `helm push ${helmProjectName}-\${version}.tgz oci://${prodRegistryPath}`,
                        forwardAllArgs: false,
                    },
                ],
            },
        },
    };

    addProjectConfiguration(tree, helmProjectName, {
        root: helmProjectPath,
        tags: [],
        targets: helmProjectTargets,
    });

    return {
        helmProjectName,
        helmProjectPath,
    };
}
