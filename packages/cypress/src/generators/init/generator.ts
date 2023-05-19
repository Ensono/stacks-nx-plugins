import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
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
    runTasksInSerial,
    joinPathFragments,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { existsSync } from 'fs';
import path from 'path';

import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    NRWLCYPRESS_VERSION,
} from '../../versions';
import { CypressGeneratorSchema } from './schema';
import {
    updateBaseTsConfig,
    updateLintFile,
    updateTsConfig,
} from './utils/update-files';
import { updateProjectJsonWithHtmlReport } from './utils/update-targets';

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
        cypressProject: joinPathFragments(
            project?.sourceRoot as string,
            'cypress',
        ),
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
            cypress: CYPRESS_VERSION,
            '@nrwl/cypress': NRWLCYPRESS_VERSION,
            'cypress-multi-reporters': CYPRESSMULTIREPORTERS_VERSION,
            mochawesome: MOCHAWESOME_VERSION,
            'mochawesome-merge': MOCHAWESOMEMERGE_VERSION,
            'mocha-junit-reporter': MOCHAWESOMEJUNITREPORTER_VERSION,
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
    updateTsConfig(tree, normalizedOptions.projectRoot);

    updateBaseTsConfig(tree);
    // add / remove files
    tree.delete(
        joinPathFragments(
            normalizedOptions.cypressProject,
            'support',
            'app.po.ts',
        ),
    );
    tree.delete(
        joinPathFragments(normalizedOptions.cypressProject, 'e2e', 'app.cy.ts'),
    );
    addFiles(
        tree,
        joinPathFragments('files', 'e2e-folder'),
        normalizedOptions.projectRoot,
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
