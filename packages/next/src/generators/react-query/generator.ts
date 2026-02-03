import {
    formatFilesWithEslint,
    hasGeneratorExecutedForProject,
    tsMorphTree,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    generateFiles,
    joinPathFragments,
    GeneratorCallback,
    logger,
    readProjectConfiguration,
    runTasksInSerial,
    Tree,
} from '@nx/devkit';
import path from 'path';

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

    // if not generated - create app/provider.tsx
    if (
        !tree.exists(
            joinPathFragments(project.root, 'src', 'app', 'providers.tsx'),
        )
    ) {
        generateFiles(tree, path.join(__dirname, 'files'), project.root, {
            template: '',
        });
    }

    const morphTree = tsMorphTree(tree);

    addQueryClientProviderToApp(project, morphTree);

    tasks.push(
        updateESLint(tree, project.root),
        installDependencies(tree, options),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks, () => {
        logger.warn(`React Query has been added to your app's _app.tsx file`);
    });
}

export default reactQueryGenerator;
