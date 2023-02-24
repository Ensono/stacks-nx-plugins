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
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import path from 'path';

import { PlaywrightGeneratorSchema } from './schema';
import { execAsync } from './utils/exec';
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

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
    const packageRunner: PackageRunner = 'npx';
    const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
        name: options.project,
        linter: Linter.EsLint,
        packageRunner,
    };

    await execAsync('npx playwright install --with-deps', tree.root);
    await initPlaywrightGenerator(tree, playwrightGeneratorSchema);
    await execAsync('npm i -D playwright', tree.root);
    await execAsync('npm i -D @playwright/test', tree.root);

    const normalizedOptions = normalizeOptions(tree, options);

    const morphTree = tsMorphTree(tree);

    // playwright.config.base.ts
    updatePlaywrightConfigBase(morphTree);

    // add extra config to playwright.config.ts in project
    updatePlaywrightConfigWithDefault(
        readProjectConfiguration(tree, options.project),
        morphTree,
    );

    // example.spec.ts
    addFiles(tree, 'files', normalizedOptions);

    // add records to gitignore
    addIgnoreEntry(tree, '.gitignore', 'Playwright', [
        '/test-results/',
        '/playwright-report/',
        '/playwright/.cache/',
    ]);

    await formatFiles(tree);
}
