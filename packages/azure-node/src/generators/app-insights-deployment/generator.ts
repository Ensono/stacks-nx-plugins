import {
    executedDependantGenerator,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { readProjectConfiguration, Tree } from '@nrwl/devkit';

import { AppInsightsDeploymentGeneratorSchema } from './schema';
import { updateDockerfile } from './utils/update-dockerfile';
import { updatePipelineStagesYaml } from './utils/update-pipeline';
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';

// eslint-disable-next-line consistent-return
export default async function appInsightsDeploymentGenerator(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        !executedDependantGenerator(
            tree,
            'WorkspaceDeployment',
            options.project,
        )
    )
        return false;
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
    updateDockerfile(project, tree);
}
