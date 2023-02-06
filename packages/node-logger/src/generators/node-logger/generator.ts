import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
    names,
    offsetFromRoot,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { winstonVersion } from '../../../utils/version';
import { NodeLoggerGeneratorSchema } from './schema';

interface NormalizedSchema extends NodeLoggerGeneratorSchema {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    parsedTags: string[];
}

function normalizeOptions(
    tree: Tree,
    options: NodeLoggerGeneratorSchema,
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
            winston: winstonVersion,
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
    options: NodeLoggerGeneratorSchema,
) {
    const normalizedOptions = normalizeOptions(tree, options);
    await libraryGenerator(tree, options);
    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    // Generate files
    addFiles(tree, normalizedOptions);

    // Update package.json
    updateDependencies(tree);

    // Format files
    if (!options.skipFormat) {
        await formatFiles(tree);
    }
}
