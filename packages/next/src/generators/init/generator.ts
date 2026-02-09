import {
    formatFilesWithEslint,
    addCustomTestConfig,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    GeneratorCallback,
    readProjectConfiguration,
    Tree,
    runTasksInSerial,
} from '@nx/devkit';

import { NextGeneratorSchema } from './schema';
import { addFiles } from './utils/add-files';
import { updateDependencies } from './utils/dependencies';
import { addEslint } from './utils/eslint';
import { updateProjectTargets } from './utils/project-targets';
import { addReactAxeConfigToApp } from './utils/react-axe';
import { modifyReadme } from './utils/readme';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    updateProjectTargets(tree, project, options);

    tasks.push(addEslint(tree, project));

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

    addCustomTestConfig(tree, project, ciCoverageConfig);
    addFiles(tree, project);
    modifyReadme(tree, project);

    tasks.push(
        addReactAxeConfigToApp(tree, project),
        updateDependencies(tree, project),
        formatFilesWithEslint(options.project),
    );

    return runTasksInSerial(...tasks);
}
