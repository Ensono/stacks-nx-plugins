import { readJson, writeJson, Tree } from '@nx/devkit';

import { InitDeploymentGeneratorSchema } from '../schema';

export function setDefaults(
    tree: Tree,
    options: InitDeploymentGeneratorSchema,
) {
    const nxJson = readJson(tree, 'nx.json');

    nxJson.generators = nxJson.generators || {};
    nxJson.generators['@ensono-stacks/workspace'] =
        nxJson.generators['@ensono-stacks/workspace'] || {};
    const current = nxJson.generators['@ensono-stacks/workspace'];

    nxJson.generators = {
        ...nxJson.generators,
        '@ensono-stacks/workspace': {
            ...current,
            init: {
                pipelineRunner: options.pipelineRunner,
            },
        },
    };
    writeJson(tree, 'nx.json', nxJson);
}
