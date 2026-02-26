import {
    createOrUpdateLocalEnv,
    verifyPluginCanBeInstalled,
    getNpmScope,
} from '@ensono-stacks/core';
import {
    formatFiles,
    generateFiles,
    GeneratorCallback,
    names,
    runTasksInSerial,
    Tree,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import { kebabCase } from 'change-case';
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
    const name = kebabCase(options.name);
    const endpointName = kebabCase(`${name}/v${options.endpointVersion}`);

    const directory = path.join(
        options.folderPath,
        name,
        `v${options.endpointVersion}`,
    );
    const projectOptions = await determineProjectNameAndRootOptions(tree, {
        name: endpointName,
        directory,
        projectType: 'library',
    });

    return {
        ...options,
        directory,
        name: endpointName,
        projectRoot: projectOptions.projectRoot,
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
    const tasks: GeneratorCallback[] = [];
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

    const libraryTask = await libraryGenerator(tree, {
        ...normalizedOptions,
        bundler: 'none',
    });

    tasks.push(libraryTask);

    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    addFiles(tree, normalizedOptions);

    createOrUpdateLocalEnv(undefined, tree, {
        [normalizedOptions.envVar]: '',
    });

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
