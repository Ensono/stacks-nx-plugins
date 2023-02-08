import { mergeProjectConfigTarget } from '@ensono-stacks/core';
import {
    ProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nrwl/devkit';

const ciCoverageConfig = {
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
