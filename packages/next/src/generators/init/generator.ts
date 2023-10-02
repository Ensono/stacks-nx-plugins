import {
    formatFiles,
    formatFilesWithEslint,
    addCustomTestConfig,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
    tsMorphTree,
} from '@ensono-stacks/core';
import {
    GeneratorCallback,
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import chalk from 'chalk';
import path from 'path';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { eslintFix } from './utils/eslint-fix';
import {
    addReactAxeConfigToApp,
    addReactAxeDependency,
} from './utils/react-axe';
import { addStorybook } from './utils/storybook';
import updateTsConfig from './utils/tsconfig';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'NextInit'))
        return false;

    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    const update = { ...project };

    if (
        project.sourceRoot &&
        project.sourceRoot ===
            update.targets?.build?.configurations?.development?.outputPath
    ) {
        update.targets.build.configurations.development = {};
    }

    updateProjectConfiguration(tree, project.name, update);

    tasks.push(addEslint(tree, project.root), addStorybook(tree, options));

    const ciCoverageConfig = {
        ci: {
            collectCoverage: true,
            coverageReporters: ['text', 'html'],
            collectCoverageFrom: [
                './**/*.{js,jsx,ts,tsx}',
                './!**/.next/**',
                './!**/*.d.ts',
                './!**/*.config.*',
                './!**/_app.*',
            ],
            codeCoverage: true,
            ci: true,
        },
    };

    await addCustomTestConfig(
        tree,
        readProjectConfiguration(tree, options.project),
        project.name,
        ciCoverageConfig,
    );

    tasks.push(
        formatFilesWithEslint(options.project),
        addReactAxeDependency(tree),
    );

    // update tsconfig.json
    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.json'),
        ['next.config.js'],
    );

    // update tsconfig.spec.json
    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.spec.json'),
    );

    const morphTree = tsMorphTree(tree);

    console.info(chalk.green`Attempting to add configuration for react-axe`);
    addReactAxeConfigToApp(project, morphTree);
    console.info(
        chalk.green`continuing execution of next:init generator after attempting to add react-axe`,
    );
    eslintFix(project, tree);

    // exclude helm yaml files from initial format when generating the files
    await formatFiles(tree, [
        joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),
    ]);

    return runTasksInSerial(...tasks, () =>
        deploymentGeneratorMessage(
            tree,
            `nx g @ensono-stacks/next:init-deployment --project ${options.project}`,
        ),
    );
}
