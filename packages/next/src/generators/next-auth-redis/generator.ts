import {
    formatFilesWithEslint,
    createOrUpdateLocalEnv,
    readStacksConfig,
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
import {
    updateDeploymentYaml,
    updateValuesYaml,
} from './utils/update-helm-templates';
import { updateProjectJsonHelmUpgradeTarget } from './utils/update-targets';
import {
    updateMainTf,
    updateOutputsTf,
    updateTfVariables,
    updateVariablesTf,
} from './utils/update-terraform-files';

export default async function nextAuthRedisGenerator(
    tree: Tree,
    options: NextAuthRedisGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);
    const stacksConfig = readStacksConfig(tree);

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

    // add files
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
        envVar: options.envVar,
        template: '',
    });

    configureAdapter(project, tree, {
        npmScope,
        libraryName,
        envVar: options.envVar,
    });

    // Update helm yamls
    updateDeploymentYaml(project, tree);
    updateValuesYaml(project, tree, stacksConfig);

    // Update terraform files
    updateMainTf(project, tree);
    updateTfVariables(project, tree, stacksConfig);
    updateVariablesTf(project, tree);
    updateOutputsTf(project, tree);

    // Update project.json
    updateProjectJsonHelmUpgradeTarget(project, tree);

    createOrUpdateLocalEnv(project, tree, {
        [options.envVar]: DEFAULT_REDIS_URL,
    });

    await formatFiles(tree);

    return runTasksInSerial(
        installDependencies(tree),
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
