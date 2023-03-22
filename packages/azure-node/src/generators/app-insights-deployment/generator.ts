import { readProjectConfiguration, Tree } from '@nrwl/devkit';

import { AppInsightsDeploymentGeneratorSchema } from './schema';
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';

export default async function appInsightsDeploymentGenerator(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);

    // Update project.json
    updateProjectJsonHelmUpgradeTarget(project, tree, options);
}
