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
    runTasksInSerial,
} from '@nx/devkit';
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

    console.log('1');

    if (hasGeneratorExecutedForProject(tree, options.project, 'NextAuth', true))
        return false;

    console.log('2');

    const project = readProjectConfiguration(tree, options.project);

    console.log('3');
    if (
        !tree.exists(
            joinPathFragments(
                project.root,
                'src',
                'app',
                'api',
                'auth',
                '[...nextauth]',
                'route.ts',
            ),
        )
    ) {
        generateFiles(tree, path.join(__dirname, 'files'), project.root, {
            template: '',
        });
    }

    console.log('4');

    const morphTree = tsMorphTree(tree);
    console.log('5');

    console.log({ tree });

    addSessionProviderToApp(project, morphTree);

    console.log('6');
    if (options.provider === 'azureAd') {
        addAzureAdProvider(project, morphTree);
    }

    addToLocalEnv(project, tree, options.provider);

    // exclude helm yaml files from initial format when generating the files
    await formatFiles(tree, [
        joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),
    ]);

    return runTasksInSerial(
        options.skipPackageJson ? () => {} : installDependencies(tree),
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
