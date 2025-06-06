import {
    execAsync,
    formatFilesWithEslint,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    GeneratorCallback,
    logger,
    readProjectConfiguration,
    runTasksInSerial,
    Tree,
} from '@nx/devkit';
import { storybookConfigurationGenerator } from '@nx/react';

import { StorybookGeneratorSchema } from './schema';
import { createFiles } from './utils/createFiles';
import { installDependencies } from './utils/dependancies';
import { updateESLint } from './utils/eslint';

export async function storybookGenerator(
    tree: Tree,
    options: StorybookGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        hasGeneratorExecutedForProject(tree, options.project, 'Storybook', true)
    ) {
        return false;
    }

    const tasks: GeneratorCallback[] = [];

    const project = readProjectConfiguration(tree, options.project);

    // Run NPM install after eslint dependencies etc have been added to package.json
    const npmInstall = (): GeneratorCallback => {
        return async () => {
            try {
                await execAsync('npm install', project.root);
            } catch {
                console.log(`Error installing dependencies on ${project.name}`);
            }
        };
    };

    const addStorybook = await storybookConfigurationGenerator(tree, {
        interactionTests: true,
        project: options.project,
    });

    tasks.push(
        installDependencies(tree, options),
        addStorybook,
        updateESLint(tree, project.root),
        createFiles(tree, project),
        formatFilesWithEslint(options.project),
        npmInstall(),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`Storybook files have been added to ${project.name} app`);
    });
}

export default storybookGenerator;
