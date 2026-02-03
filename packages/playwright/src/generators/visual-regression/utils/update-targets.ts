import {
    joinPathFragments,
    ProjectConfiguration,
    readJson,
    Tree,
    updateJson,
} from '@nx/devkit';

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

        return nxJson;
    });
}

export function updateProjectJsonWithNativeVisualRegressionTargets(
    project: ProjectConfiguration,
    tree: Tree,
) {
    const packageJson = readJson(tree, 'package.json');

    const playwrightVersion =
        `v${packageJson.devDependencies.playwright?.replace('^', '')}` ||
        'next';

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
                                command: `docker run -v $(pwd):/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:${playwrightVersion}-jammy npx nx run ${project.name}:e2e {args.extra}`,
                                forwardAllArgs: false,
                            },
                        ],
                    },
                    configurations: {
                        updatesnapshots: {
                            args: "--extra='--update-snapshots --grep @visual-regression'",
                        },
                        compilearm64: {
                            commands: [
                                {
                                    command: `docker run -v $(pwd):/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:${playwrightVersion}-jammy /bin/bash -c "apt update && apt install -y make gcc g++ && npm install -g prebuildify && cd node_modules/@parcel/watcher && npm run prebuild --openssl_fips=''"`,
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
