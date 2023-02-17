import { addIgnoreEntry, tsMorphTree } from '@ensono-stacks/core';
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
    APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
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
import { updateProjectJsonWithNativeVisualRegressionTargets } from './utils/update-targets';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';

interface NormalizedSchema extends PlaywrightGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

const visualRegressionTypes = {
    NATIVE: 'native',
    APPLITOOLS: 'applitools',
};

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

async function updateDependencies(
    tree: Tree,
    fileOptions: { accessibility: boolean; visualRegression: string },
) {
    let devDependencies = {};
    const { accessibility, visualRegression } = fileOptions;

    const accessibilityDeps = {
        '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
        'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
    };
    const applitoolsDeps = {
        '@applitools/eyes-playwright': APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
    };

    if (accessibility) devDependencies = accessibilityDeps;
    if (visualRegression === visualRegressionTypes.APPLITOOLS)
        devDependencies = { ...devDependencies, ...applitoolsDeps };

    return addDependenciesToPackageJson(tree, {}, devDependencies);
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

    const fileOptions = {
        accessibility: options.accessibility,
        visualRegression: options.visualRegression,
    };

    // playwright.config.base.ts
    updatePlaywrightConfigBase(morphTree);

    // add extra config to playwright.config.ts in project
    updatePlaywrightConfigWithDefault(project, morphTree);

    // example.spec.ts
    addFiles(tree, 'files/default', normalizedOptions);

    // add records to gitignore
    addIgnoreEntry(tree, '.gitignore', 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    if (options.accessibility) {
        // generate acessiblity files
        addFiles(tree, 'files/accessibility', normalizedOptions);
    }

    switch (options.visualRegression) {
        case visualRegressionTypes.NATIVE:
            // add extra to playwright.config.ts in project
            updatePlaywrightConfigWithNativeVisualRegression(
                project,
                morphTree,
            );

            // update project.json with new visual target
            updateProjectJsonWithNativeVisualRegressionTargets(project, tree);

            // update tasks.yaml
            updateTasksYaml(tree, { visualRegression: true });

            // update taskctl.yaml
            updateTaskctlYaml(tree, { visualRegression: true });

            // example.spec.ts
            addFiles(tree, 'files/visualRegression/native', normalizedOptions);
            break;
        case visualRegressionTypes.APPLITOOLS:
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
        default:
            // update tasks.yaml
            updateTasksYaml(tree, { visualRegression: false });
            // update taskctl.yaml
            updateTaskctlYaml(tree, { visualRegression: false });
    }

    await formatFiles(tree);

    return updateDependencies(tree, fileOptions);
}
