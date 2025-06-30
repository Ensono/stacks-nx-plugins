import {
    formatFilesWithEslint,
    addCustomTestConfig,
    NormalizedSchema as BaseNormalizedSchema,
    normalizeOptions,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    GeneratorCallback,
    names,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
    runTasksInSerial,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { WinstonLoggerGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { WINSTON_VERSION } from './utils/version';

type NormalizedSchema = BaseNormalizedSchema<WinstonLoggerGeneratorSchema>;

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            winston: WINSTON_VERSION,
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
    options: WinstonLoggerGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    const tasks: GeneratorCallback[] = [];
    const normalizedOptions = await normalizeOptions(tree, options, 'library');

    await libraryGenerator(tree, options);
    // Delete the default generated lib folder
    tree.delete(path.join(normalizedOptions.projectRoot, 'src', 'lib'));

    // Generate files
    addFiles(tree, normalizedOptions);

    const project = readProjectConfiguration(
        tree,
        normalizedOptions.projectName,
    );

    tasks.push(
        updateDependencies(tree),
        addEslint(tree, project.root),
        formatFilesWithEslint(options.name),
    );

    const ciCoverageConfig = {
        ci: {
            collectCoverage: true,
            coverageReporters: ['text', 'html'],
            collectCoverageFrom: ['./**/*.{js,jsx,ts,tsx}', './!**/*.config.*'],
            codeCoverage: true,
            ci: true,
        },
    };

    if (project.name) {
        addCustomTestConfig(tree, project, ciCoverageConfig);
    }

    // Format files
    if (!options.skipFormat) {
        await formatFiles(tree);
    }

    // Update package.json
    return runTasksInSerial(...tasks);
}
