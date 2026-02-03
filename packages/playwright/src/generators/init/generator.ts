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
    getPackageManagerCommand,
    output,
    workspaceRoot,
    readProjectConfiguration,
} from '@nx/devkit';
import { configurationGenerator } from '@nx/playwright';
import { ConfigurationGeneratorSchema } from '@nx/playwright/src/generators/configuration/schema.d';
import { execSync } from 'child_process';
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

function getBrowsersInstallTask() {
    return () => {
        output.log({
            title: 'Ensuring Playwright is installed.',
            bodyLines: ['use --skipInstall to skip installation.'],
        });

        const pm = getPackageManagerCommand();

        execSync(`${pm.exec} playwright install --with-deps`, {
            cwd: workspaceRoot,
            windowsHide: false,
        });
    };
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
    const pm = getPackageManagerCommand();

    const sourceConfig = readProjectConfiguration(
        tree,
        normalizedOptions.project,
    );
    const port = sourceConfig.targets?.serve?.options?.port || 3000;

    const playwrightGeneratorSchema: ConfigurationGeneratorSchema = {
        linter: 'eslint',
        directory: 'src',
        project: projectE2EName,
        js: false,
        skipFormat: false,
        skipPackageJson: false,
        setParserOptionsProject: false,
        skipInstall: true,
        webServerCommand: `${pm.exec} nx run ${normalizedOptions.project}:serve`,
        webServerAddress: `http://127.0.0.1:${port}`,
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

    tasks.push(e2eTask, updateDependencies(tree), getBrowsersInstallTask());

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
