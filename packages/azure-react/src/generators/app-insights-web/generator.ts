import {
    hasGeneratorExecutedForProject,
    NormalizedSchema,
    normalizeOptions,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/react';
import path from 'path';

import { AppInsightsWebGeneratorSchema } from './schema';
import updateTsConfig from './utils/tsconfig';
import {
    appInsightsReactVersion,
    appInsightsWebVersion,
} from '../../utils/versions';

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            '@microsoft/applicationinsights-web': appInsightsWebVersion,
            '@microsoft/applicationinsights-react-js': appInsightsReactVersion,
        },
        {},
    );
}

function addFiles(
    tree: Tree,
    options: NormalizedSchema<AppInsightsWebGeneratorSchema>,
) {
    const templateOptions = {
        ...options,
        applicationinsightsConnectionString:
            options.applicationinsightsConnectionString,
        offsetFromRoot: offsetFromRoot(options.directory),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, 'files'),
        options.projectRoot,
        templateOptions,
    );
}

export default async function appInsightsWebGenerator(
    tree: Tree,
    options: AppInsightsWebGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    if (
        hasGeneratorExecutedForProject(
            tree,
            options.name,
            'AzureReactAppInsightsWeb',
        )
    )
        return false;

    if (!options.applicationinsightsConnectionString) {
        throw new Error('applicationinsightsConnectionString cannot be empty.');
    }

    const normalizedOptions = await normalizeOptions(tree, options, 'library');

    // Use the existing library generator
    await libraryGenerator(tree, {
        ...options,
        linter: Linter.EsLint,
        style: 'none',
        minimal: true,
    });

    // Generate files
    addFiles(tree, normalizedOptions);

    const project = readProjectConfiguration(tree, options.name);

    updateTsConfig(tree, path.join(project.root, 'tsconfig.json'));

    // Format files
    await formatFiles(tree);

    // Update package.json and install dependencies
    return updateDependencies(tree);
}
