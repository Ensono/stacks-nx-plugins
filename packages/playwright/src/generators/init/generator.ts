import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    execAsync,
    hasGeneratorExecutedForProject,
    tsMorphTree,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import initPlaywrightGenerator from '@mands/nx-playwright/src/generators/project/generator';
import { NxPlaywrightGeneratorSchema } from '@mands/nx-playwright/src/generators/project/schema-types';
import {
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
    readProjectConfiguration,
    addDependenciesToPackageJson,
    joinPathFragments,
    updateJson,
    runTasksInSerial,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import path from 'path';

import { PlaywrightGeneratorSchema } from './schema';
import { updatePlaywrightConfigWithDefault } from './utils/update-playwright-config';
import { updatePlaywrightConfigBase } from './utils/update-playwright-config-base';
import { PLAYWRIGHT_VERSION } from '../../utils/versions';

interface NormalizedSchema extends PlaywrightGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

function updateTsConfig(tree: Tree, project: string) {
    updateJson(tree, joinPathFragments(project, 'tsconfig.json'), tsconfig => ({
        ...tsconfig,
        compilerOptions: {
            ...tsconfig.compilerOptions,
            lib: ['dom'],
        },
    }));
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

    const projectRootE2E = `${options.projectRoot}-e2e/src`;

    generateFiles(
        tree,
        path.join(__dirname, source),
        projectRootE2E,
        templateOptions,
    );
}

function updateDependencies(tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            playwright: PLAYWRIGHT_VERSION,
            '@playwright/test': PLAYWRIGHT_VERSION,
            '@mands/nx-playwright': '^0.6.3',
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'PlaywrightInit'))
        return false;

    const projectE2E = `${options.project}-e2e`;

    const optionsE2E = {
        ...options,
        projectE2E,
    };
    const normalizedOptionsForE2E = normalizeOptions(tree, optionsE2E);

    const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
        name: projectE2E,
        linter: Linter.EsLint,
        packageRunner: 'npx',
        project: options.project,
    };

    await initPlaywrightGenerator(tree, playwrightGeneratorSchema);

    const morphTree = tsMorphTree(tree);

    // playwright.config.base.ts
    updatePlaywrightConfigBase(morphTree);

    // add extra config to playwright.config.ts in project
    updatePlaywrightConfigWithDefault(
        readProjectConfiguration(tree, projectE2E),
        morphTree,
    );

    // example.spec.ts
    addFiles(tree, 'files', normalizedOptionsForE2E);

    // remove app.spec.ts added from @mands generato
    const { projectRoot } = normalizedOptionsForE2E;
    tree.delete(`${projectRoot}-e2e/src/app.spec.ts`);

    // Update tsconfig
    updateTsConfig(tree, `${projectRoot}-e2e`);

    // add records to gitignore
    addIgnoreEntry(tree, '.gitignore', 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    await formatFiles(tree);

    return runTasksInSerial(
        updateDependencies(tree),
        () =>
            deploymentGeneratorMessage(
                tree,
                'nx g @ensono-stacks/playwright:init-deployment',
            ),
        () => execAsync('npx playwright install', projectRoot) as Promise<void>,
    );
}
