import {
    hasGeneratorExecutedForProject,
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
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
import { Linter } from '@nrwl/linter';
import { libraryGenerator } from '@nrwl/react';
import path from 'path';

import {
    appInsightsReactVersion,
    appInsightsWebVersion,
} from '../../../utils/versions';
import { AppInsightsWebGeneratorSchema } from './schema';
import updateTsConfig from './utils/tsconfig';

type NormalizedSchema = BaseNormalizedSchema<AppInsightsWebGeneratorSchema>;

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

function addFiles(tree: Tree, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        ...names(options.name),
        applicationinsightsConnectionString:
            options.applicationinsightsConnectionString,
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

    // Normalize options
    const normalizedOptions = normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, {
        ...options,
        linter: Linter.EsLint,
        style: 'none',
    });
    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    // Generate files
    addFiles(tree, normalizedOptions);

    const project = readProjectConfiguration(tree, options.name);
    updateTsConfig(tree, path.join(project.root, 'tsconfig.json'));

    // Format files
    await formatFiles(tree);

    // Update package.json and install dependencies
    return updateDependencies(tree);
}
