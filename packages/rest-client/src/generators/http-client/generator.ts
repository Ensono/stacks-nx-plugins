import {
    addCustomTestConfig,
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
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
import chalk from 'chalk';
import path from 'path';

import { axiosVersion } from '../../../utils/versions';
import { HttpClientGeneratorSchema } from './schema';

type NormalizedSchema = BaseNormalizedSchema<HttpClientGeneratorSchema>;

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            axios: axiosVersion,
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

    if (normalizedOptions.directory) {
        console.log(
            chalk.yellow`NOTE: you generated the http client inside ${normalizedOptions.directory} directory, which means that the library is now called ${normalizedOptions.projectName}`,
        );
        console.log(
            chalk.yellow`      Remember this when running nx commands like "nx test ${normalizedOptions.projectName}"`,
        );
    }
}
