import { readJson, Tree, NxJsonStacks } from '@nrwl/devkit';

export class StacksConfigError extends Error {}

function readStacksJson(tree: Tree) {
    const nxJsonStacks = readJson(tree, 'nx.json').stacks as NxJsonStacks;

    if (!nxJsonStacks) {
        throw new StacksConfigError(
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
        throw new StacksConfigError(
            'Incomplete Stacks configuration in nx.json.',
        );
    }

    return (({
        config: { business, cloud, domain, pipeline, terraform, vcs },
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
