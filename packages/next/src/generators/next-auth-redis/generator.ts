import {
    formatFilesWithEslint,
    createOrUpdateLocalEnv,
    hasGeneratorExecutedForProject,
    deploymentGeneratorMessage,
} from '@ensono-stacks/core';
import {
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    logger,
    formatFiles,
    readWorkspaceConfiguration,
    names,
    getWorkspaceLayout,
    generateFiles,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { NextAuthRedisGeneratorSchema } from './schema';
import { DEFAULT_REDIS_URL } from './utils/constants';
import { installDependencies } from './utils/dependencies';
import { configureAdapter } from './utils/redis-adapter';

export default async function nextAuthRedisGenerator(
    tree: Tree,
    options: NextAuthRedisGeneratorSchema,
) {
    if (hasGeneratorExecutedForProject(tree, options.project, 'NextAuthRedis'))
        return false;

    const project = readProjectConfiguration(tree, options.project);

    const nextAuthApiFilePath = joinPathFragments(
        project.root,
        'pages',
        'api',
        'auth',
        '[...nextauth].ts',
    );
    if (!tree.exists(nextAuthApiFilePath)) {
        throw new Error(
            `Could not find ${nextAuthApiFilePath} . Did you configure Next-Auth for this project?`,
        );
    }

    const { npmScope } = readWorkspaceConfiguration(tree);
    const name = options.adapterName;

    const libraryName = names(name).fileName;
    const projectDirectory = libraryName;
    const projectRoot = `${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;

    // generate the lib package
    await libraryGenerator(tree, {
        name: libraryName,
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
        npmScope,
        libraryName,
        envVar: options.envVar,
    });

    createOrUpdateLocalEnv(project, tree, {
        [options.envVar]: DEFAULT_REDIS_URL,
    });

    await formatFiles(tree);

    deploymentGeneratorMessage(
        tree,
        `nx g @ensono-stacks/next:next-auth-redis-deployment --project ${options.project}`,
    );

    return runTasksInSerial(
        installDependencies(tree),
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
