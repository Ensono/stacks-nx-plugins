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

import { StorybookGeneratorSchema } from './schema';
import { addCustomCommand } from './utils/addCustomCommand';
import { addStorybook } from './utils/addStorybook';
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

    tasks.push(
        updateESLint(tree, project.root),
        installDependencies(tree, options),
        await addStorybook(tree, project),
        createFiles(tree, project),
        addCustomCommand(tree, project),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`Storybook files have been added to ${project.name} app`);
    });
}

export default storybookGenerator;
