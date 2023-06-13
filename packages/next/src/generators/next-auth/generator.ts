import {
    tsMorphTree,
    formatFiles,
    formatFilesWithEslint,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    generateFiles,
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    logger,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { NextAuthGeneratorSchema } from './schema';
import { installDependencies } from './utils/dependencies';
import { addToLocalEnv } from './utils/local-env';
import { addAzureAdProvider } from './utils/next-auth-provider';
import { addSessionProviderToApp } from './utils/session-provider';

export default async function nextAuthGenerator(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'NextAuth', true))
        return false;

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

    addToLocalEnv(project, tree, options.provider);

    // exclude helm yaml files from initial format when generating the files
    await formatFiles(tree, [
        joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),
    ]);

    return runTasksInSerial(
        !options.skipPackageJson ? installDependencies(tree) : () => {},
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
