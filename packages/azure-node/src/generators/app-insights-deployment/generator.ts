import { generateFiles, readProjectConfiguration, Tree } from '@nrwl/devkit';
import path from 'path';

import { AppInsightsDeploymentGeneratorSchema } from './schema';

export default async function appInsightsDeploymentGenerator(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);

    // add common project files
    generateFiles(tree, path.join(__dirname, 'files/common'), project.root, {
        projectName: project.name,
    });
}
