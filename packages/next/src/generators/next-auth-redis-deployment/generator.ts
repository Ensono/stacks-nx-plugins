import {
    formatFilesWithEslint,
    readStacksConfig,
    getResourceGroup,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
/*
    TODO: https://dev.azure.com/amido-dev/Amido-Stacks/_workitems/edit/6236
    This generator has been removed from the generators.json because it needs work
*/
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
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'NextAuthRedisDeployment',
        )
    )
        return false;

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
            projectName: project.name,
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
