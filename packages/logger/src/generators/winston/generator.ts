import {
    formatFilesWithEslint,
    addCustomTestConfig,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    GeneratorCallback,
    getWorkspaceLayout,
    names,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { WinstonLoggerGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { WINSTON_VERSION } from './utils/version';

interface NormalizedSchema extends WinstonLoggerGeneratorSchema {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    parsedTags: string[];
}

function normalizeOptions(
    tree: Tree,
    options: WinstonLoggerGeneratorSchema,
): NormalizedSchema {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory
        ? `${names(options.directory).fileName}/${name}`
        : name;
    const projectName = projectDirectory.replace(/\//g, '-');
    const projectRoot = `${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;
    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags,
    };
}

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
    const tasks: GeneratorCallback[] = [];
    const normalizedOptions = normalizeOptions(tree, options);

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
        await addCustomTestConfig(
            tree,
            project,
            project.name,
            ciCoverageConfig,
        );
    }

    // Format files
    if (!options.skipFormat) {
        await formatFiles(tree);
    }

    // Update package.json
    return runTasksInSerial(...tasks);
}
