import {
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
    warnDirectoryProjectName,
} from '@ensono-stacks/core';
import { formatFiles, generateFiles, names, Tree } from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { ClientEndpointGeneratorSchema } from './schema';

type NormalizedSchema = BaseNormalizedSchema<ClientEndpointGeneratorSchema> & {
    endpointName: string;
};

const VALID_METHODS = [
    'get',
    'post',
    'patch',
    'put',
    'delete',
    'head',
    'options',
];

function addFiles(tree: Tree, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        ...names(options.name),
        fnSuffix: names(options.endpointName).className,
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
        methods: optionsParameter.methods.map(method => method.toLowerCase()),
    };
    const normalizedOptions = normalizeOptions(tree, options);

    if (
        Array.isArray(normalizedOptions.methods) &&
        normalizedOptions.methods.length === 0
    ) {
        throw new Error("You haven't selected any method to generate.");
    }

    const hasInvalidMethod = normalizedOptions.methods.some(
        method => !VALID_METHODS.includes(method),
    );
    if (hasInvalidMethod) {
        throw new Error(
            `Invalid HTTP method passed to --methods. Please choose from ${VALID_METHODS.join(
                ',',
            )}`,
        );
    }

    if (Number.isNaN(Number(normalizedOptions.endpointVersion))) {
        throw new TypeError('The endpoint version needs to be a number.');
    }

    await libraryGenerator(tree, normalizedOptions);
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

    warnDirectoryProjectName(normalizedOptions);
}
