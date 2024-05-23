/*
    TODO: https://dev.azure.com/amido-dev/Amido-Stacks/_workitems/edit/6236
    This generator has been removed from the generators.json because it needs work
*/
import {
    formatFilesWithEslint,
    createOrUpdateLocalEnv,
    hasGeneratorExecutedForProject,
    deploymentGeneratorMessage,
    verifyPluginCanBeInstalled,
    getNpmScope,
} from '@ensono-stacks/core';
import {
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    logger,
    formatFiles,
    readNxJson,
    names,
    getWorkspaceLayout,
    generateFiles,
    runTasksInSerial,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { NextAuthRedisGeneratorSchema } from './schema';
import { DEFAULT_REDIS_URL } from './utils/constants';
import { installDependencies } from './utils/dependencies';
import { configureAdapter } from './utils/redis-adapter';

export default async function nextAuthRedisGenerator(
    tree: Tree,
    options: NextAuthRedisGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'NextAuthRedis'))
        return false;

    const project = readProjectConfiguration(tree, options.project);

    const nextAuthApiFilePath = joinPathFragments(
        project.root,
        'src',
        'auth.ts',
    );
    if (!tree.exists(nextAuthApiFilePath)) {
        throw new Error(
            `Could not find ${nextAuthApiFilePath} . Did you configure Next-Auth for this project?`,
        );
    }

    const name = options.adapterName;

    const libraryName = names(name).fileName;
    const projectDirectory = libraryName;
    const projectRoot = `apps/${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;

    // generate the lib package
    await libraryGenerator(tree, {
        name: libraryName,
        directory: `apps/${libraryName}`,
        projectNameAndRootFormat: 'as-provided',
    });
    // delete the default generated lib folder
    const libraryDirectory = path.join(projectRoot, 'src');
    tree.delete(path.join(libraryDirectory, 'lib'));

    // add library files
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
        envVar: options.envVar,
        template: '',
    });

    configureAdapter(project, tree, {
        npmScope: `@${getNpmScope(tree)}`,
        libraryName,
        envVar: options.envVar,
    });

    createOrUpdateLocalEnv(project, tree, {
        [options.envVar]: DEFAULT_REDIS_URL,
    });

    await formatFiles(tree);

    return runTasksInSerial(
        installDependencies(tree),
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(
                `Do not forget to update your .env.local environment variables with values.`,
            );
        },
        () =>
            deploymentGeneratorMessage(
                tree,
                `nx g @ensono-stacks/next:next-auth-redis-deployment --project ${options.project}`,
            ),
    );
}
