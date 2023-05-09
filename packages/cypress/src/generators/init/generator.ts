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
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import { updateLintFile } from '../utils/update-files';
import { updateProjectJsonWithHtmlReport } from '../utils/update-targets';
import { CypressGeneratorSchema } from './schema';

interface NormalizedSchema extends CypressGeneratorSchema {
    projectName: string;
    e2eNameForProject: string;
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
        e2eNameForProject: `${project?.name as string}-e2e`,
        projectRoot: project?.root as string,
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
    await cypressE2EConfigurationGenerator(tree, {
        project: normalizedOptions.projectName,
    });
    // update eslint.rc
    updateLintFile(tree);

    // add / remove files
    tree.delete(
        path.join(
            normalizedOptions.e2eNameForProject,
            'src',
            'support',
            'app.po.ts',
        ),
    );
    tree.delete(
        path.join(
            normalizedOptions.e2eNameForProject,
            'src',
            'e2e',
            'app.cy.ts',
        ),
    );
    addFiles(
        tree,
        path.join('files', 'e2e-folder'),
        normalizedOptions.e2eNameForProject,
        normalizedOptions,
    );
    addFiles(
        tree,
        path.join('files', 'root'),
        normalizedOptions.projectRoot,
        normalizedOptions,
    );

    // update targets
    updateProjectJsonWithHtmlReport(
        readProjectConfiguration(tree, normalizedOptions.e2eNameForProject),
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
