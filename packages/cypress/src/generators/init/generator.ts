import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
    tsMorphTree,
} from '@ensono-stacks/core';
import {
    CypressE2EConfigSchema,
    cypressE2EConfigurationGenerator,
} from '@nrwl/cypress/src/generators/cypress-e2e-configuration/cypress-e2e-configuration';
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
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { CypressGeneratorSchema } from './schema';

interface NormalizedSchema extends CypressGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

function normalizeOptions(
    tree: Tree,
    options: CypressGeneratorSchema,
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
            // Needs changing
            '@nrwl/cypress': '15.9.2',
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: CypressGeneratorSchema,
) {
    if (hasGeneratorExecutedForProject(tree, options.project, 'CypressInit'))
        return false;

    const projectE2E = `${options.project}-e2e`;

    const optionsE2E = {
        ...options,
        projectE2E,
    };
    const normalizedOptionsForE2E = normalizeOptions(tree, optionsE2E);

    const cypressGeneratorSchema: CypressGeneratorSchema = {
        project: options.project,
    };

    await cypressE2EConfigurationGenerator(tree, cypressGeneratorSchema);

    const morphTree = tsMorphTree(tree);

    // add records to gitignore
    // addIgnoreEntry(tree, '.gitignore', 'cypress', [
    //     '/test-results/',
    //     '/cypress-report/',
    //     '/cypress/.cache/',
    // ]);

    await formatFiles(tree);

    return runTasksInSerial(updateDependencies(tree), () =>
        deploymentGeneratorMessage(
            tree,
            'nx g @ensono-stacks/cypress:init-deployment',
        ),
    );
}
