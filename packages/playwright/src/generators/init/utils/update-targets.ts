import {
    joinPathFragments,
    ProjectConfiguration,
    readJson,
    Tree,
    updateJson,
} from '@nrwl/devkit';

function updateNxJson(tree) {
    updateJson(tree, 'nx.json', nxJson => {
        const updatedNxJson = { ...nxJson };

        if (
            Array.isArray(
                nxJson.taskRunnerOptions?.default?.options?.cacheableOperation,
            ) &&
            !nxJson.taskRunnerOptions?.default?.options?.cacheableOperation.includes(
                'e2e-docker',
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
        `v${packageJson.dependencies.playwright?.replace('^', '')}` || 'next';

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
                                command: `docker run -v $PWD:/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:${playwrightVersion}-jammy npx nx run ${project.name}:e2e {args.extra}`,
                                forwardAllArgs: false,
                            },
                        ],
                    },
                    configurations: {
                        updatesnapshots: {
                            args: '--extra="--update-snapshots --grep @visual-regression"',
                        },
                        compilearm64: {
                            commands: [
                                {
                                    command: `docker run -v $PWD:/project -w /project --rm --ipc=host mcr.microsoft.com/playwright:${playwrightVersion}-jammy /bin/bash -c "apt update && apt install -y make gcc g++ && rm -rf node_modules/@parcel && npm install" && npm install`,
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
