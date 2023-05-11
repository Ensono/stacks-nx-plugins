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
    updateJson,
    runTasksInSerial,
    joinPathFragments,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { existsSync } from 'fs';
import path from 'path';

import { updateLintFile, updateTsConfig } from '../utils/update-files';
import { updateProjectJsonWithHtmlReport } from '../utils/update-targets';
import { CypressGeneratorSchema } from './schema';

interface NormalizedSchema extends CypressGeneratorSchema {
    projectName: string;
    projectRoot: string;
    cypressProject: string;
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
        cypressProject: joinPathFragments(project?.name as string, 'cypress'),
    };
}

function addFiles(
    tree: Tree,
    source: string,
    destination: string,
    options: NormalizedSchema,
) {
    const templateOptions = {
        ...options,
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, source),
        destination,
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
    const normalizedOptions = normalizeOptions(tree, options);

    const cypressGeneratorConfiguration: CypressE2EConfigSchema = {
        project: normalizedOptions.projectName,
        directory: 'cypress',
        linter: Linter.EsLint,
    };

    await cypressE2EConfigurationGenerator(tree, cypressGeneratorConfiguration);
    // update eslint.rc
    updateLintFile(tree);

    // update ts config
    updateTsConfig(tree, normalizedOptions.projectName);

    // add / remove files
    tree.delete(
        joinPathFragments(
            normalizedOptions.cypressProject,
            'src',
            'support',
            'app.po.ts',
        ),
    );
    tree.delete(
        joinPathFragments(
            normalizedOptions.cypressProject,
            'src',
            'e2e',
            'app.cy.ts',
        ),
    );
    // tree.delete(
    //     joinPathFragments(normalizedOptions.projectName, 'cypress.config.ts'),
    // );
    addFiles(
        tree,
        joinPathFragments('files', 'e2e-folder'),
        normalizedOptions.projectName,
        normalizedOptions,
    );
    if (!existsSync(joinPathFragments(tree.root, 'cypress.config.base.ts'))) {
        addFiles(
            tree,
            joinPathFragments('files', 'root'),
            '',
            normalizedOptions,
        );
    }

    // update targets
    updateProjectJsonWithHtmlReport(
        normalizedOptions.projectRoot,
        readProjectConfiguration(tree, normalizedOptions.projectName),
        tree,
    );
    // update git ignore
    addIgnoreEntry(tree, '.gitignore', 'Cypress', ['**/test-results']);

    await formatFiles(tree);

    return runTasksInSerial(updateDependencies(tree), () =>
        deploymentGeneratorMessage(
            tree,
            'nx g @ensono-stacks/cypress:init-deployment',
        ),
    );
}
