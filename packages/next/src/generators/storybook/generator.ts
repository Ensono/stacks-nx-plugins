import {
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
import { installDependencies } from './utils/dependencies';
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

    const addStorybook = await storybookConfigurationGenerator(tree, {
        interactionTests: true,
        project: options.project,
    });

    tasks.push(
        addStorybook,
        installDependencies(tree, options),
        updateESLint(tree, project.root),
        createFiles(tree, project),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`Storybook files have been added to ${project.name} app`);
    });
}

export default storybookGenerator;
