import { readJson, Tree, NxJsonStacks } from '@nx/devkit';

export class StacksError extends Error {}

function readStacksJson(tree: Tree) {
    const nxJsonStacks = readJson(tree, 'nx.json').stacks as NxJsonStacks;

    if (!nxJsonStacks) {
        throw new StacksError(
            'Stacks configuration is not set. Please update nx.json.',
        );
    }

    return nxJsonStacks;
}

export function readStacksConfig(tree: Tree) {
    const stacksJson = readStacksJson(tree);

    if (
        !stacksJson.config.business ||
        !stacksJson.config.cloud ||
        !stacksJson.config.domain ||
        !stacksJson.config.vcs
    ) {
        throw new StacksError('Incomplete Stacks configuration in nx.json.');
    }

    /* eslint-disable unicorn/no-unreadable-iife */
    return (({
        config: { business, cloud, domain, pipeline, terraform, vcs },
        executedGenerators,
        // eslint-disable-next-line unicorn/no-unreadable-iife
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
        throw new StacksError(
            'Incomplete Stacks configuration in nx.json. Missing `executedGenerators` attribute.',
        );
    }

    return stacksJson.executedGenerators;
}
