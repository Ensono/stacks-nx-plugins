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

    /*
        const normalizedOptions = normalizeOptions(tree, {
        ...options,
        name: options.project,
        directory: tree.root,
    });
     */

    tasks.push(
        updateESLint(tree, project.root),
        installDependencies(tree, options),
        await addStorybook(tree, project),
        createFiles(tree, project),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`Storybook has been added to your app's _app.tsx file`);
    });
}

export default storybookGenerator;
