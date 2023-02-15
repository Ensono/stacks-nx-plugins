import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';

function updateNxJson(tree) {
    updateJson(tree, 'nx.json', nxJson => {
        const updatedNxJson = { ...nxJson };

        if (
            Array.isArray(
                nxJson.taskRunnerOptions?.default?.options?.cacheableOperation,
            )
        ) {
            updatedNxJson.taskRunnerOptions.default.options.cacheableOperations.push(
                'e2e-docker',
            );
        }

        return updateNxJson;
    });
}

export function updateProjectJsonWithNativeVisualRegressionTargets(
    project: ProjectConfiguration,
    tree: Tree,
) {
    updateJson(
        tree,
        joinPathFragments(project.root, 'project.json'),
        projectJson => {
            const updatedProjectJson = { ...projectJson };

            if (!projectJson.targets['e2e-docker']) {
                updatedProjectJson.targets['e2e-docker'] = {
                    executor: 'nx:run-commands',
                    options: {
                        commands: [
                            {
                                command:
                                    'docker run -v $PWD:/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:v1.30.0-jammy npx nx run next-custom-server-e2e:e2e',
                                forwardAllArgs: false,
                            },
                        ],
                    },
                    configurations: {
                        updatesnapshots: {
                            args: '--extra=--update-snapshots',
                        },
                        compilearm64: {
                            commands: [
                                {
                                    command:
                                        'docker run -v $PWD:/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:v1.30.0-jammy /bin/bash -c "apt update && apt install -y make gcc g++ && rm -rf node_modules/@parcel && npm install" && npm install',
                                    forwardAllArgs: false,
                                },
                            ],
                        },
                    },
                };
            }

            return updatedProjectJson;
        },
    );

    // Add new e2e-docker target to cachable operations
    updateNxJson(tree);
}
