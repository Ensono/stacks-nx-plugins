import {
    tsMorphTree,
    formatFilesWithEslint,
    readStacksConfig,
} from '@ensono-stacks/core';
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
import { addRedisAdapter } from './utils/redis-adapter';
import { addSessionProviderToApp } from './utils/session-provider';
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

export default async function nextAuthGenerator(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.project);
    const stacksConfig = readStacksConfig(tree);

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

    if (options.redisAdapter) {
        await addRedisAdapter(tree, project, morphTree, {
            envVar: options.redisEnvVar,
            name: options.redisAdapterName,
        });

        // Update project.json
        updateProjectJsonHelmUpgradeTarget(project, tree);

        // Update helm yamls
        updateDeploymentYaml(project, tree);
        updateValuesYaml(project, tree, stacksConfig);

        // Update terraform files
        updateMainTf(project, tree);
        updateTfVariables(project, tree, stacksConfig);
        updateVariablesTf(project, tree);
        updateOutputsTf(project, tree);
    }

    createOrUpdateLocalEnv(project, tree, {
        provider: options.provider,
        redisEnvVar: options.redisAdapter ? options.redisEnvVar : undefined,
    });

    await formatFiles(tree);

    return runTasksInSerial(
        !options.skipPackageJson
            ? installDependencies(tree, { addRedis: options.redisAdapter })
            : () => {},
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`Do not forget to update your .env.local environment variables with values.
`);
        },
    );
}
