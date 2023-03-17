import {
    formatFiles,
    formatFilesWithEslint,
    addCustomTestConfig,
    deploymentGeneratorMessage,
} from '@ensono-stacks/core';
import {
    GeneratorCallback,
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { eslintFix } from './utils/eslint-fix';
import updateTsConfig from './utils/tsconfig';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
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

    tasks.push(formatFilesWithEslint(options.project));

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

    eslintFix(project, tree);

    // exclude helm yaml files from initial format when generating the files
    await formatFiles(tree, [
        joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),
    ]);

    tasks.push(() => {
        deploymentGeneratorMessage(
            tree,
            `nx g @ensono-stacks/next:init-deployment --project ${options.project}`,
        );
    });

    return runTasksInSerial(...tasks);
}
