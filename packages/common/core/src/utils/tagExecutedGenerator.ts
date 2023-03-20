import { Tree, updateJson } from '@nrwl/devkit';

export function tagExecutedGenerator(tree: Tree, generatorName: string) {
    updateJson(tree, 'nx.json', nxJson => ({
        ...nxJson,
        stacks: {
            ...nxJson?.stacks,
            generatorsExecuted: {
                ...nxJson?.stacks?.generatorsExecuted,
                [generatorName]: true,
            },
        },
    }));
}
