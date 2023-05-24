import {
    executedDependantGenerator,
    hasGeneratorExecutedForProject,
} from '@ensono-stacks/core';
import { readProjectConfiguration, Tree } from '@nx/devkit';

import { AppInsightsDeploymentGeneratorSchema } from './schema';
import { updateDockerfile } from './utils/update-dockerfile';
import { updatePipelineStagesYaml } from './utils/update-pipeline';
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';

// eslint-disable-next-line consistent-return
export default async function appInsightsDeploymentGenerator(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
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
