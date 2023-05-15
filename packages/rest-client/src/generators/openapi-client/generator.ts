import { copyFiles, normalizeOptions } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { orvalVersion } from '../../../utils/versions';
import { OpenapiClientGeneratorSchema } from './schema';

export default async function generate(
    tree: Tree,
    options: OpenapiClientGeneratorSchema,
) {
    if (!tree.exists(options.schema)) {
        throw new Error(
            'Provided schema does not exist in the workspace. Please check and try again.',
        );
    }

    const normalizedOptions = normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, normalizedOptions);

    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${options.name}`;

    const schemaPath = path.basename(options.schema);

    // Copy schema into generated lib folder
    copyFiles(tree, `./${options.schema}`, `./${projectRoot}/${schemaPath}`);

    // Generate orval.config.js in new lib folder
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
        schemaName: options.name,
        schemaPath,
    });

    await formatFiles(tree);

    return addDependenciesToPackageJson(tree, {}, { orval: orvalVersion });
}
