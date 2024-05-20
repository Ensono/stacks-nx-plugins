import {
    deploymentGeneratorMessage,
    execAsync,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
    addDependenciesToPackageJson,
    runTasksInSerial,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/js';
import { configurationGenerator } from '@nx/playwright';
// eslint-disable-next-line import/no-unresolved, import/extensions
import { ConfigurationGeneratorSchema } from '@nx/playwright/src/generators/configuration/schema';
import path from 'path';

import { PlaywrightGeneratorSchema } from './schema';
import { PLAYWRIGHT_VERSION } from '../../utils/versions';

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
        offsetFromRoot: offsetFromRoot(options.project),
        template: '',
    };

    const projectRootE2E = `apps/${options.project}/src`;

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
            '@nx/playwright': '18.3.4',
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

    const normalizedOptions = normalizeOptions(tree, options);

    const projectE2EName = `${normalizedOptions.project}-e2e`;

    const playwrightGeneratorSchema: ConfigurationGeneratorSchema = {
        linter: Linter.EsLint,
        directory: 'src',
        project: projectE2EName,
        js: false,
        skipFormat: false,
        skipPackageJson: false,
        setParserOptionsProject: false,
    };

    await libraryGenerator(tree, {
        name: projectE2EName,
        directory: `apps/${projectE2EName}`,
        projectNameAndRootFormat: 'as-provided',
    });
    // Delete the default generated lib folder
    tree.delete(path.join('apps', projectE2EName, 'src', 'index.ts'));
    tree.delete(path.join('apps', projectE2EName, 'src', 'lib'));
    await configurationGenerator(tree, playwrightGeneratorSchema);

    await formatFiles(tree);

    return runTasksInSerial(
        updateDependencies(tree),
        () =>
            deploymentGeneratorMessage(
                tree,
                'nx g @ensono-stacks/playwright:init-deployment',
            ),
        () =>
            execAsync(
                'npx playwright install',
                `apps/${projectE2EName}`,
            ) as Promise<void>,
    );
}
