import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
    tsMorphTree,
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
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import path from 'path';

import { PLAYWRIGHT_VERSION } from '../../utils/versions';
import { PlaywrightGeneratorSchema } from './schema';
import { updatePlaywrightConfigWithDefault } from './utils/update-playwright-config';
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
            '@playwright/test': '*',
            '@mands/nx-playwright': '*',
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
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
    updatePlaywrightConfigBase(morphTree, options.project);

    // add extra config to playwright.config.ts in project
    updatePlaywrightConfigWithDefault(
        readProjectConfiguration(tree, projectE2E),
        morphTree,
    );

    // example.spec.ts
    addFiles(tree, 'files', normalizedOptionsForE2E);

    // remove app.spec.ts added from @mands generator
    const { projectRoot } = normalizedOptionsForE2E;
    tree.delete(`${projectRoot}-e2e/src/app.spec.ts`);

    // add records to gitignore
    addIgnoreEntry(tree, '.gitignore', 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    await formatFiles(tree);

    return () => {
        deploymentGeneratorMessage(
            tree,
            'nx g @ensono-stacks/playwright:init-deployment',
        );

        return updateDependencies(tree);
    };
}
