import { addGitIgnoreEntry, tsMorphTree } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
} from '@nrwl/devkit';
import chalk from 'chalk';
import path from 'path';

import {
    AXE_CORE_PLAYWRIGHT_VERSION,
    AXE_RESULTS_PRETTY_PRINT_VERSION,
} from '../../utils/versions';
import { PlaywrightGeneratorSchema } from './schema';
import {
    updatePlaywrightConfigWithApplitoolsVisualRegression,
    updatePlaywrightConfigWithDefault,
    updatePlaywrightConfigWithNativeVisualRegression,
} from './utils/update-playwright-config';
import { updatePlaywrightConfigBase } from './utils/update-playwright-config-base';

interface NormalizedSchema extends PlaywrightGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

function normalizeOptions(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
): NormalizedSchema {
    const project = getProjects(tree).get(options.project);

    return {
        ...options,
        projectName: project?.name as string,
        projectRoot: project?.sourceRoot as string,
    };
}

function addFiles(tree: Tree, source: string, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, source),
        options.projectRoot,
        templateOptions,
    );
}

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
            'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(`${options.project} project does not exist`);
    }

    const normalizedOptions = normalizeOptions(tree, options);

    const morphTree = tsMorphTree(tree);

    // playwright.config.base.ts
    updatePlaywrightConfigBase(morphTree);

    // add extra config to playwright.config.ts in project
    updatePlaywrightConfigWithDefault(project, morphTree);

    // example.spec.ts
    addFiles(tree, 'files/default', normalizedOptions);

    // add records to gitignore
    addGitIgnoreEntry(tree, 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    if (options.accessibility) {
        // generate acessiblity files
        addFiles(tree, 'files/accessibility', normalizedOptions);
    }

    switch (options.visualRegression) {
        case 'native':
            // add extra to playwright.config.ts in project
            updatePlaywrightConfigWithNativeVisualRegression(
                project,
                morphTree,
            );

            // example.spec.ts
            addFiles(tree, 'files/visualRegression/native', normalizedOptions);
            break;
        case 'applitools':
            // add extra to playwright.config.ts in project
            updatePlaywrightConfigWithApplitoolsVisualRegression(
                project,
                morphTree,
            );

            // example.spec.ts
            addFiles(
                tree,
                'files/visualRegression/applitools',
                normalizedOptions,
            );

            console.warn(
                chalk.yellow`Don't forget to set your 'APPLITOOLS_API_KEY'.`,
            );
            break;
        default: // Default case
    }

    await formatFiles(tree);

    return options.accessibility && updateDependencies(tree);
}
