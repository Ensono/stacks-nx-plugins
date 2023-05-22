import {
    addCustomTestConfig,
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
    warnDirectoryProjectName,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    names,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { AXIOS_VERSION } from '../../../utils/versions';
import { HttpClientGeneratorSchema } from './schema';

type NormalizedSchema = BaseNormalizedSchema<HttpClientGeneratorSchema>;

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
    const normalizedOptions = normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, normalizedOptions);
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

    await addCustomTestConfig(
        tree,
        project,
        normalizedOptions.projectName,
        ciCoverageConfig,
    );

    // Format files
    if (!normalizedOptions.skipFormat) {
        await formatFiles(tree);
    }

    warnDirectoryProjectName(normalizedOptions);
}
