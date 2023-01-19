import { addGitIgnoreEntry } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
} from '@nrwl/devkit';
import path from 'path';

import {
    AXE_CORE_PLAYWRIGHT_VERSION,
    AXE_RESULTS_PRETTY_PRINT_VERSION,
} from '../../utils/versions';
import { PlaywrightGeneratorSchema } from './schema';

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
        projectName: project.name,
        projectRoot: project.sourceRoot,
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

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
    const normalizedOptions = normalizeOptions(tree, options);

    // TODO: Add extra to playwright.config.ts in project

    // TODO: playwright.config.base.ts

    // example.spec.ts
    addFiles(tree, 'files/base', normalizedOptions);

    // Add records to gitignore
    addGitIgnoreEntry(
        tree,
        ['/test-results/', '/playwright-report/', '/playwright/.cache/'],
        'Playwright',
    );

    if (options.accessibility) {
        // Add dependencies
        addDependenciesToPackageJson(
            tree,
            {
                '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
                'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
            },
            {},
        );

        // Generate acessiblity files
        addFiles(tree, 'files/accessibility', normalizedOptions);
    }

    switch (options.visualRegression) {
        case 'native':
            // TODO: Add extra to playwright.config.ts in project

            // example.spec.ts
            addFiles(tree, 'files/visualRegression/native', normalizedOptions);

            break;
        case 'applitools':
            // Add dependencies
            addDependenciesToPackageJson(
                tree,
                {
                    '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
                    'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
                },
                {},
            );

            // TODO: Add extra to playwright.config.ts in project

            // example.spec.ts
            addFiles(
                tree,
                'files/visualRegression/applitools',
                normalizedOptions,
            );

            break;
        default:
            // Default case
            console.log('default case');
    }

    await formatFiles(tree);
}
