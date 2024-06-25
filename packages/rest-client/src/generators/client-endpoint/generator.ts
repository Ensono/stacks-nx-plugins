import {
    createOrUpdateLocalEnv,
    verifyPluginCanBeInstalled,
    getNpmScope,
} from '@ensono-stacks/core';
import {
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
    names,
    Tree,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import { paramCase } from 'change-case';
import path from 'path';

import { ClientEndpointGeneratorSchema } from './schema';

const VALID_METHODS = [
    'get',
    'post',
    'patch',
    'put',
    'delete',
    'head',
    'options',
];

async function normalizeOptions(
    tree: Tree,
    options: ClientEndpointGeneratorSchema,
) {
    const name = paramCase(options.name);
    const endpointName = paramCase(`${name}/v${options.endpointVersion}`);
    let directory = path.join(name, `v${options.endpointVersion}`);

    if (options.directory) {
        directory = path.join(options.directory, directory);
    }

    if (options.projectNameAndRootFormat === 'derived') {
        const { libsDir } = getWorkspaceLayout(tree);
        directory = path.join(libsDir, directory);
    }

    const projectOptions = await determineProjectNameAndRootOptions(tree, {
        name: endpointName,
        directory,
        projectType: 'library',
        projectNameAndRootFormat: 'as-provided',
        callingGenerator: '@ensono-stacks/rest-client:client-endpoint',
    });

    return {
        ...options,
        directory,
        name: endpointName,
        projectRoot: projectOptions.projectRoot,
        projectNameAndRootFormat: 'as-provided' as const,
        importPath:
            options.importPath ?? `@${getNpmScope(tree)}/${endpointName}`,
    };
}

function addFiles(
    tree: Tree,
    options: Awaited<ReturnType<typeof normalizeOptions>>,
) {
    const templateOptions = {
        ...options,
        endpointName: names(options.name).className,
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
    options: ClientEndpointGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    const normalizedOptions = await normalizeOptions(tree, options);

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

    await libraryGenerator(tree, {
        ...normalizedOptions,
        bundler: 'none',
    });

    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    addFiles(tree, normalizedOptions);

    createOrUpdateLocalEnv(undefined, tree, {
        [normalizedOptions.envVar]: '',
    });

    await formatFiles(tree);
}
