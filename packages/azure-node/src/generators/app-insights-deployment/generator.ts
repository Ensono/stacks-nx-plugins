import {
    hasGeneratorExecutedForProject,
    hasGeneratorExecutedForWorkspace,
} from '@ensono-stacks/core';
import { readProjectConfiguration, Tree } from '@nrwl/devkit';

import { AppInsightsDeploymentGeneratorSchema } from './schema';
import { updatePipelineStagesYaml } from './utils/update-pipeline';
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';

// eslint-disable-next-line consistent-return
export default async function appInsightsDeploymentGenerator(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'AzureNodeAppInsightsDeployment',
        )
    )
        return false;

    const project = readProjectConfiguration(tree, options.project);

    // Update project.json
    updateProjectJsonHelmUpgradeTarget(project, tree, options);
    updatePipelineStagesYaml(tree, options);
}
