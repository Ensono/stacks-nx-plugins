import {
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
} from '@ensono-stacks/core';
import { formatFiles, generateFiles, names, Tree } from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { ClientEndpointGeneratorSchema } from './schema';

type NormalizedSchema = BaseNormalizedSchema<ClientEndpointGeneratorSchema>;

function addFiles(tree: Tree, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        ...names(options.name),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, 'files'),
        options.projectRoot,
        templateOptions,
    );
}

export default async function clientEndpoint(
    tree: Tree,
    optionsParameter: ClientEndpointGeneratorSchema,
) {
    const options = {
        ...optionsParameter,
        // include endpoint version in library name
        name: `${optionsParameter.name}/v${optionsParameter.endpointVersion}`,
        endpointName: optionsParameter.name,
    };
    const normalizedOptions = normalizeOptions(tree, options);

    if (Array.isArray(options.methods) && options.methods.length === 0) {
        throw new Error("You haven't selected any method to generate.");
    }

    if (Number.isNaN(Number(options.endpointVersion))) {
        throw new TypeError('The endpoint version needs to be a number.');
    }

    await libraryGenerator(tree, options);
    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    addFiles(tree, normalizedOptions);

    // Add env variable
    let source = tree.exists('.env')
        ? (tree.read('.env') as Buffer).toString()
        : '';
    if (!source.includes(normalizedOptions.envVar)) {
        source = source !== '' ? `${source}\n` : '';
        source += `${normalizedOptions.envVar}=`;
        tree.write('.env', source);
    }

    await formatFiles(tree);
}
