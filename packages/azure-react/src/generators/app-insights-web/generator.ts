import {
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    names,
    offsetFromRoot,
    Tree,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { libraryGenerator } from '@nrwl/react';
import path from 'path';

import {
    appInsightsReactVersion,
    appInsightsWebVersion,
} from '../../../utils/versions';
import { AppInsightsWebGeneratorSchema } from './schema';

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
        connectionString: names(options.connectionString).constantName,
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
    if (!options.connectionString) {
        throw new Error('connectionString cannot be empty.');
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

    // Format files
    await formatFiles(tree);

    // Update package.json and install dependencies
    return updateDependencies(tree);
}
