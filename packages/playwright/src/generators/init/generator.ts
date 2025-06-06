import {
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    formatFiles,
    getProjects,
    Tree,
    addDependenciesToPackageJson,
    runTasksInSerial,
    addProjectConfiguration,
    NX_VERSION,
    GeneratorCallback,
} from '@nx/devkit';
import { configurationGenerator } from '@nx/playwright';
import { ConfigurationGeneratorSchema } from '@nx/playwright/src/generators/configuration/schema.d';
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

function updateDependencies(tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            playwright: PLAYWRIGHT_VERSION,
            '@playwright/test': PLAYWRIGHT_VERSION,
            '@nx/playwright': NX_VERSION,
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: PlaywrightGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'PlaywrightInit'))
        return false;

    const normalizedOptions = normalizeOptions(tree, options);

    const projectE2EName = `${normalizedOptions.project}-e2e`;

    const playwrightGeneratorSchema: ConfigurationGeneratorSchema = {
        linter: 'eslint',
        directory: 'src',
        project: projectE2EName,
        js: false,
        skipFormat: false,
        skipPackageJson: false,
        setParserOptionsProject: false,
        webServerCommand: `npx nx start ${normalizedOptions.project}`,
        webServerAddress: 'http://127.0.0.1:3000',
    };

    addProjectConfiguration(tree, projectE2EName, {
        root: normalizedOptions.directory,
        projectType: 'application',
        sourceRoot: path.join(normalizedOptions.directory, 'src'),
        targets: {},
        tags: [],
        implicitDependencies: [options.project],
    });

    const e2eTask = await configurationGenerator(
        tree,
        playwrightGeneratorSchema,
    );

    tasks.push(e2eTask, updateDependencies(tree));

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
