import { readJson, Tree, NxJsonConfiguration } from '@nrwl/devkit';

export function readStacksConfig(tree: Tree) {
    const nxJson = readJson(tree, 'nx.json') as NxJsonConfiguration;

    if (!nxJson.stacks) {
        throw new Error(
            'Stacks configuration is not set. Please update nx.json.',
        );
    }

    return nxJson.stacks;
}
