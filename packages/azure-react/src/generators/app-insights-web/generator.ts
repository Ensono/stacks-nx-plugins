import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
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

interface NormalizedSchema extends AppInsightsWebGeneratorSchema {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    parsedTags: string[];
}

function normalizeOptions(
    tree: Tree,
    options: AppInsightsWebGeneratorSchema,
): NormalizedSchema {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory
        ? `${names(options.directory).fileName}/${name}`
        : name;
    const projectName = projectDirectory.replace(/\//g, '-');
    const projectRoot = `${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;
    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags,
    };
}

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
    // Update package.json
    updateDependencies(tree);

    // Format files
    await formatFiles(tree);
}
