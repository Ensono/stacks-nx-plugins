import { readStacksConfig, getRegistryUrl } from '@ensono-stacks/core';
import { logger, generateFiles, Tree } from '@nrwl/devkit';
import { paramCase } from 'change-case';
import path from 'path';

import { InstallGeneratorSchema } from '../schema';

export function addPipeline(tree: Tree, options: InstallGeneratorSchema) {
    const stacksConfig = readStacksConfig(tree);

    if (!stacksConfig.pipeline) {
        throw new Error(
            'Stacks Config is missing the "pipeline" option. Please configure nx.json with the stacks options.',
        );
    }

    if (tree.exists('build')) {
        throw new Error(
            'A build folder already exists in the root. Remove the folder before running with a pipeline runner.',
        );
    }

    const {
        business: { company, domain, component },
        domain: { external: externalDomain },
        cloud: { region },
        pipeline,
        vcs: { type: vcsType },
    } = stacksConfig;

    const prefix = paramCase(`${company}-${domain}`);

    let pipelineOptions: Record<string, string | number> = {
        externalDomain,
        companyName: company,
        vcsType,
    };

    if (pipeline === 'azdo') {
        const azureOptions = {
            commonVariableGroup: paramCase(`${prefix}-${component}-common`),
            nonprodVariableGroup: paramCase(`${prefix}-${component}-nonprod`),
            prodVariableGroup: paramCase(`${prefix}-${component}-prod`),
            nonprodAKSResource: paramCase(`${prefix}-prod-${region}-core`),
            prodAKSResource: paramCase(`${prefix}-prod-${region}-core`),
            nonprodRegistry: getRegistryUrl(stacksConfig, 'nonprod'),
            prodRegistry: getRegistryUrl(stacksConfig, 'prod'),
        };

        pipelineOptions = {
            ...pipelineOptions,
            ...azureOptions,
        };
    }

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', options.pipelineRunner, 'common'),
        '',
        pipelineOptions,
    );

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', options.pipelineRunner, pipeline),
        '',
        pipelineOptions,
    );

    return () => {
        logger.warn(
            `Review the pipeline files in build/. Search for "%REPLACE% and make any necessary changes.`,
        );
    };
}
