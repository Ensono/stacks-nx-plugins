import { addIgnoreEntry, tsMorphTree } from '@ensono-stacks/core';
import initPlaywrightGenerator from '@mands/nx-playwright/src/generators/project/generator';
import { NxPlaywrightGeneratorSchema } from '@mands/nx-playwright/src/generators/project/schema-types';
import { PackageRunner } from '@mands/nx-playwright/src/types';
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

    generateFiles(
        tree,
        path.join(__dirname, source),
        options.projectRoot,
        templateOptions,
    );
}

function updateDependencies(tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            playwright: '*',
            '@playwright/test': '*',
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
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

    // add records to gitignore
    addIgnoreEntry(tree, '.gitignore', 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    await formatFiles(tree);

    return updateDependencies(tree);
}
