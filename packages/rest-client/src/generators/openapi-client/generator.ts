import {
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
} from '@ensono-stacks/core';
import { formatFiles, getWorkspaceLayout, names, Tree } from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { OpenapiClientGeneratorSchema } from './schema';

type NormalizedSchema = BaseNormalizedSchema<OpenapiClientGeneratorSchema>;

export default async function generate(
    tree: Tree,
    options: OpenapiClientGeneratorSchema,
) {
    const normalizedOptions = normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, normalizedOptions);
    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    await formatFiles(tree);
}
