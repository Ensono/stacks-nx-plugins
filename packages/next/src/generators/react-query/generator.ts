import {
    formatFiles,
    formatFilesWithEslint,
    hasGeneratorExecutedForProject,
    tsMorphTree,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    GeneratorCallback,
    joinPathFragments,
    logger,
    readJson,
    readProjectConfiguration,
    Tree,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';

import { ReactQueryGeneratorSchema } from './schema';
import { installDependencies } from './utils/dependancies';
import { updateESLint } from './utils/eslint';
import { addQueryClientProviderToApp } from './utils/query-client-provider';

export async function reactQueryGenerator(
    tree: Tree,
    options: ReactQueryGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'ReactQuery',
            true,
        )
    ) {
        return false;
    }

    const tasks: GeneratorCallback[] = [];

    const project = readProjectConfiguration(tree, options.project);

    const morphTree = tsMorphTree(tree);

    addQueryClientProviderToApp(project, morphTree);

    tasks.push(
        updateESLint(tree, project.root, options),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`React Query has been added to your app's _app.tsx file`);
    });
}

export default reactQueryGenerator;
