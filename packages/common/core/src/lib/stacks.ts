import { readJson, Tree, NxJsonConfiguration } from '@nrwl/devkit';

export class StacksConfigError extends Error {}

function readStacksJson(tree: Tree) {
    const nxJson = readJson(tree, 'nx.json') as NxJsonConfiguration;

    if (!nxJson.stacks) {
        throw new StacksConfigError(
            'Stacks configuration is not set. Please update nx.json.',
        );
    }

    return nxJson.stacks;
}

export function readStacksConfig(tree: Tree) {
    const stacksJson = readStacksJson(tree);

    if (
        !stacksJson.business ||
        !stacksJson.cloud ||
        !stacksJson.domain ||
        !stacksJson.vcs
    ) {
        throw new StacksConfigError(
            'Incomplete Stacks configuration in nx.json.',
        );
    }

    return (({
        business,
        cloud,
        domain,
        pipeline,
        terraform,
        vcs,
        executedGenerators,
    }) => ({
        business,
        cloud,
        domain,
        pipeline,
        terraform,
        vcs,
        executedGenerators,
    }))(stacksJson);
}

export function readStacksExecutedGenerators(tree: Tree) {
    const stacksJson = readStacksJson(tree);

    if (!stacksJson.executedGenerators) {
        throw new StacksConfigError(
            'Incomplete Stacks configuration in nx.json. Missing `executedGenerators` attribute.',
        );
    }

    return stacksJson.executedGenerators;
}
