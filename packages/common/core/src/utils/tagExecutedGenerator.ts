import { Tree, updateJson } from '@nx/devkit';

export function tagExecutedGeneratorForProject(
    tree: Tree,
    projectName: string,
    generatorName: string,
) {
    updateJson(tree, 'nx.json', nxJson => ({
        ...nxJson,
        stacks: {
            ...nxJson.stacks,
            executedGenerators: {
                ...nxJson.stacks.executedGenerators,
                project: {
                    ...nxJson.stacks.executedGenerators.project,
                    [projectName]: [
                        ...nxJson.stacks.executedGenerators.project[
                            projectName
                        ],
                        generatorName,
                    ],
                },
            },
        },
    }));
}

export function tagExecutedGeneratorForWorkspace(
    tree: Tree,
    generatorName: string,
) {
    updateJson(tree, 'nx.json', nxJson => ({
        ...nxJson,
        stacks: {
            ...nxJson.stacks,
            executedGenerators: {
                ...nxJson.stacks.executedGenerators,
                workspace: [
                    ...nxJson.stacks.executedGenerators.workspace,
                    generatorName,
                ],
            },
        },
    }));
}

/*
stacks: {
    executedGenerators: {
        project: {
            "project1": ["gen1", "gen2"]
        },
        workspace: ["gen3", "gen4"]
    }
}
*/
