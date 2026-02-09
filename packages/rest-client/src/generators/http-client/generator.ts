import {
    addCustomTestConfig,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    names,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { HttpClientGeneratorSchema } from './schema';
import { AXIOS_VERSION } from '../../utils/versions';

async function normalizeOptions(
    tree: Tree,
    options: HttpClientGeneratorSchema,
) {
    const { importPath, projectName, projectRoot } =
        await determineProjectNameAndRootOptions(tree, {
            ...options,
            projectType: 'library',
        });

    return {
        ...options,
        importPath,
        projectName,
        projectRoot,
    };
}

type NormalizedSchema = Awaited<ReturnType<typeof normalizeOptions>>;

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            axios: AXIOS_VERSION,
        },
        {},
    );
}

function addFiles(tree: Tree, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        ...names(options.name),
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, 'files'),
        options.projectRoot,
        templateOptions,
    );
}

export default async function generate(
    tree: Tree,
    options: HttpClientGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    const normalizedOptions = await normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, {
        ...normalizedOptions,
        bundler: 'none',
        testEnvironment: 'node',
        unitTestRunner: 'jest',
    });

    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    // Generate files
    addFiles(tree, normalizedOptions);
    // Update package.json
    updateDependencies(tree);

    const project = readProjectConfiguration(
        tree,
        normalizedOptions.projectName,
    );
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

    // Format files
    if (!normalizedOptions.skipFormat) {
        await formatFiles(tree);
    }
}
