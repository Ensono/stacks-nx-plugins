import { formatFilesWithEslint, readStacksConfig } from '@ensono-stacks/core';
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
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';
import {
    updateMainTf,
    updateOutputsTf,
    updateTfVariables,
    updateVariablesTf,
} from './utils/update-terraform-files';

export default async function nextAuthRedisDeploymentGenerator(
    tree: Tree,
    options: NextAuthRedisDeploymentGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);
    const stacksConfig = readStacksConfig(tree);

    // add project files
    generateFiles(tree, path.join(__dirname, 'files'), project.root, {
        projectName: project.name,
        nonprodNextAuthUrl: `${project.name}.${stacksConfig.domain.internal}`,
        prodNextAuthUrl: `${project.name}.${stacksConfig.domain.external}`,
    });

    // Update terraform files
    updateMainTf(project, tree);
    updateTfVariables(project, tree, stacksConfig);
    updateVariablesTf(project, tree);
    updateOutputsTf(project, tree);

    // Update project.json
    updateProjectJsonHelmUpgradeTarget(project, tree);

    await formatFiles(tree);

    return runTasksInSerial(formatFilesWithEslint(options.project), () => {
        logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
    });
}
