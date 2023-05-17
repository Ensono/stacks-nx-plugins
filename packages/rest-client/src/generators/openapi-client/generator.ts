import {
    addIgnoreEntry,
    copyFiles,
    execAsync,
    normalizeOptions,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    readProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import {
    FAKERJS_VERSION,
    MSW_VERSION,
    ORVAL_VERSION,
    ZOD_VERSION,
} from '../../../utils/versions';
import { printZod } from './art';
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

    const callbackTasks = [];

    const normalizedOptions = normalizeOptions(tree, options);

    // Use the existing library generator
    await libraryGenerator(tree, normalizedOptions);

    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    const project = readProjectConfiguration(
        tree,
        normalizedOptions.projectName,
    );

    const schemaPath = path.basename(options.schema);

    // Copy schema into generated lib folder
    copyFiles(tree, `./${options.schema}`, `./${project.root}/${schemaPath}`);

    // Add prettierignore entry
    addIgnoreEntry(tree, '.prettierignore', 'openapi-client', [
        `${project.root}/src`,
    ]);

    // Generate orval.config.js in new lib folder
    generateFiles(tree, path.join(__dirname, 'files/client'), project.root, {
        schemaName: options.name,
        schemaPath,
        template: '',
    });

    callbackTasks.push(
        addDependenciesToPackageJson(
            tree,
            {},
            {
                orval: ORVAL_VERSION,
                msw: MSW_VERSION,
                '@faker-js/faker': FAKERJS_VERSION,
            },
        ),
        () =>
            execAsync(
                'orval --config ./orval.config.js',
                project.root,
            ) as Promise<void>,
    );

    if (options.zod) {
        generateFiles(tree, path.join(__dirname, 'files/zod'), project.root, {
            schemaName: options.name,
            schemaPath,
            template: '',
        });

        // Push ZOD generation to callback tasks
        callbackTasks.push(
            addDependenciesToPackageJson(
                tree,
                {
                    zod: ZOD_VERSION,
                },
                {},
            ),
            () =>
                execAsync(
                    'orval --config ./orval.zod.config.js',
                    project.root,
                ) as Promise<void>,
            () => printZod(),
        );
    }

    await formatFiles(tree);

    return runTasksInSerial(...callbackTasks);
}