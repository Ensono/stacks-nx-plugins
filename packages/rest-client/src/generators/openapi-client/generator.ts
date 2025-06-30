import {
    addIgnoreEntry,
    copyFiles,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    readProjectConfiguration,
    Tree,
    runTasksInSerial,
    GeneratorCallback,
    getPackageManagerCommand,
    logger,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import { execSync } from 'child_process';
import path from 'path';

import { OpenapiClientGeneratorSchema } from './schema';
import {
    FAKERJS_VERSION,
    MSW_VERSION,
    ORVAL_VERSION,
    ZOD_VERSION,
} from '../../../utils/versions';

async function normalizeOptions(
    tree: Tree,
    options: OpenapiClientGeneratorSchema,
) {
    const { importPath, projectName, projectRoot } =
        await determineProjectNameAndRootOptions(tree, {
            ...options,
            projectType: 'library',
        });

    return {
        ...options,
        importPath,
        projectName,
        projectRoot,
    };
}

export default async function generate(
    tree: Tree,
    options: OpenapiClientGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    const normalizedOptions = await normalizeOptions(tree, options);

    if (
        !normalizedOptions.schema ||
        !tree.exists(normalizedOptions.schema) ||
        !tree.isFile(normalizedOptions.schema)
    ) {
        throw new Error(
            'Provided schema does not exist in the workspace. Please check and try again.',
        );
    }

    const callbackTasks: GeneratorCallback[] = [];

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

    // Add eslintignore entry
    addIgnoreEntry(tree, '.eslintignore', 'openapi-client', [
        `${project.root}/src`,
    ]);

    // Generate orval.config.js in new lib folder
    generateFiles(tree, path.join(__dirname, 'files/client'), project.root, {
        schemaName: options.name,
        schemaPath,
        template: '',
    });

    const pm = getPackageManagerCommand();

    const dependencies: Record<string, string> = {};

    const devDependencies: Record<string, string> = {
        orval: ORVAL_VERSION,
        msw: MSW_VERSION,
        '@faker-js/faker': FAKERJS_VERSION,
    };

    if (options.zod) {
        dependencies['zod'] = ZOD_VERSION;
        generateFiles(tree, path.join(__dirname, 'files/zod'), project.root, {
            schemaName: options.name,
            schemaPath,
            template: '',
        });
    }

    callbackTasks.push(
        addDependenciesToPackageJson(tree, dependencies, devDependencies),
        () => {
            execSync(
                `${pm.exec} orval --config ${normalizedOptions.projectRoot}/orval.config.js`,
            );
        },
    );

    if (options.zod) {
        callbackTasks.push(() => {
            execSync(
                `${pm.exec} orval --config ${normalizedOptions.projectRoot}/orval.zod.config.js`,
            );
        });
    }

    await formatFiles(tree);

    return runTasksInSerial(...callbackTasks);
}
