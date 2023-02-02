import { tsMorphTree, formatFilesWithEslint } from '@ensono-stacks/core';
import {
    generateFiles,
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    logger,
    formatFiles,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { NextAuthGeneratorSchema } from './schema';
import { installDependencies } from './utils/dependencies';
import { createOrUpdateLocalEnv } from './utils/local-env';
import { addAzureAdProvider } from './utils/next-auth-provider';
import { addSessionProviderToApp } from './utils/session-provider';

export default async function nextAuthGenerator(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);

    if (
        !tree.exists(
            joinPathFragments(
                project.root,
                'pages',
                'api',
                'auth',
                '[...nextauth].ts',
            ),
        )
    ) {
        generateFiles(tree, path.join(__dirname, 'files'), project.root, {
            template: '',
        });
    }

    const morphTree = tsMorphTree(tree);

    addSessionProviderToApp(project, morphTree);

    if (options.provider === 'azureAd') {
        addAzureAdProvider(project, morphTree);
    }

    createOrUpdateLocalEnv(project, tree, options.provider);

    await formatFiles(tree);

    return runTasksInSerial(
        !options.skipPackageJson ? installDependencies(tree) : () => {},
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
