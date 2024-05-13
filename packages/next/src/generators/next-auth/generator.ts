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

export default async function nextAuthGenerator(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'NextAuth', true))
        return false;

    const project = readProjectConfiguration(tree, options.project);

    // if not generated - create route.ts in pages/api/auth/[...nextauth] and auth.ts in root directory
    if (!tree.exists(joinPathFragments(project.root, 'src', 'auth.ts'))) {
        generateFiles(tree, path.join(__dirname, 'files'), project.root, {
            template: '',
        });
    }

    const morphTree = tsMorphTree(tree);

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
