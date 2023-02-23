import { mergeProjectConfigTarget } from '@ensono-stacks/core';
import {
    ProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nrwl/devkit';

// const ciCoverageConfig = {
//     test: {
//         executor: '@nrwl/linter:eslint',
//         outputs: ['{options.outputFile}'],
//         options: {
//             lintFilePatterns: ['libs/app-insights/**/*.{ts,tsx,js,jsx}'],
//         },
//     },
// };

const ciCoverageConfig = {
    test: {
        executor: '@nrwl/jest:jest',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        options: {
            jestConfig: 'apps/myapp/jest.config.ts',
            passWithNoTests: true,
        },
        configurations: {
            ci: {
                ci: true,
                codeCoverage: true,
            },
        },
    },
};

export default async function addCustomTestConfig(
    tree: Tree,
    projectConfig: ProjectConfiguration,
) {
    const updatedConfig = mergeProjectConfigTarget(
        projectConfig,
        {
            configurations: {
                ci: {
                    ...ciCoverageConfig,
                },
            },
        },
        'test',
    );
    updateProjectConfiguration(tree, projectConfig.name, updatedConfig);
}
