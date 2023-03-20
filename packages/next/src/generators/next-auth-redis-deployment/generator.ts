import {
    formatFilesWithEslint,
    readStacksConfig,
    getResourceGroup,
} from '@ensono-stacks/core';
import {
    readProjectConfiguration,
    Tree,
    logger,
    formatFiles,
    generateFiles,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { NextAuthRedisDeploymentGeneratorSchema } from './schema';
import {
    updateProjectJsonHelmUpgradeTarget,
    updateProjectJsonTerraformPlanTarget,
} from './utils/update-targets';

export default async function nextAuthRedisDeploymentGenerator(
    tree: Tree,
    options: NextAuthRedisDeploymentGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);
    const stacksConfig = readStacksConfig(tree);

    // add common project files
    generateFiles(tree, path.join(__dirname, 'files/common'), project.root, {
        projectName: project.name,
        nonprodNextAuthUrl: `${project.name}.${stacksConfig.domain.internal}`,
        prodNextAuthUrl: `${project.name}.${stacksConfig.domain.external}`,
    });

    // add cloud project files
    generateFiles(
        tree,
        path.join(__dirname, `files/${stacksConfig.cloud.platform}`),
        project.root,
        {
            nonProdResourceGroup: getResourceGroup(stacksConfig, 'nonprod'),
            prodResourceGroup: getResourceGroup(stacksConfig, 'prod'),
        },
    );

    // Update project.json
    updateProjectJsonHelmUpgradeTarget(project, tree);
    updateProjectJsonTerraformPlanTarget(project, tree);

    await formatFiles(tree);

    return runTasksInSerial(formatFilesWithEslint(options.project), () => {
        logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
    });
}
