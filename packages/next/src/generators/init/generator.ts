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
    runTasksInSerial,
} from '@nx/devkit';
import chalk from 'chalk';
import path from 'path';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { eslintFix } from './utils/eslint-fix';
import {
    addReactAxeConfigToApp,
    addReactAxeDependency,
} from './utils/react-axe';
import { modifyReadme } from './utils/readme';
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

    tasks.push(addEslint(tree, project.root));

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

    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.json'),
        ['next.config.js'],
    );

    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.spec.json'),
    );

    tasks.push(
        formatFilesWithEslint(options.project),
        addReactAxeDependency(tree),
    );

    // Create README.md if it doesn't exist
    modifyReadme(tree, options);

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
