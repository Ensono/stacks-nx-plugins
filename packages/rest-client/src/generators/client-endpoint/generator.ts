import {
    createOrUpdateLocalEnv,
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
    warnDirectoryProjectName,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
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
        endpointName: names(options.endpointName).className,
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
    verifyPluginCanBeInstalled(tree);

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

    createOrUpdateLocalEnv(undefined, tree, {
        [normalizedOptions.envVar]: '',
    });

    await formatFiles(tree);

    warnDirectoryProjectName(normalizedOptions);
}
