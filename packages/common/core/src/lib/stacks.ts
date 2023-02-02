import { readJson, Tree, NxJsonConfiguration } from '@nrwl/devkit';

export class StacksConfigError extends Error {}

export function readStacksConfig(tree: Tree) {
    const nxJson = readJson(tree, 'nx.json') as NxJsonConfiguration;

    if (!nxJson.stacks) {
        throw new StacksConfigError(
            'Stacks configuration is not set. Please update nx.json.',
        );
    }

    if (
        !nxJson.stacks.business ||
        !nxJson.stacks.cloud ||
        !nxJson.stacks.domain ||
        !nxJson.stacks.vcs
    ) {
        throw new StacksConfigError(
            'Incomplete Stacks configuration in nx.json.',
        );
    }

    return nxJson.stacks;
}
