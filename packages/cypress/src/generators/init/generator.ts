import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    CypressE2EConfigSchema,
    cypressE2EConfigurationGenerator,
} from '@nrwl/cypress/src/generators/cypress-e2e-configuration/cypress-e2e-configuration';
import {
    formatFiles,
    Tree,
    readProjectConfiguration,
    addDependenciesToPackageJson,
    runTasksInSerial,
    joinPathFragments,
} from '@nx/devkit';
import { Linter } from '@nrwl/linter';
import { existsSync } from 'fs';

import { addFiles, normalizeOptions } from '../../utils/test-utils';
import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    NRWLCYPRESS_VERSION,
    CYPRESSGREP_VERSION,
} from '../../versions';
import { CypressGeneratorSchema } from './schema';
import {
    updateBaseTsConfig,
    updateApplicationLintFile,
    updateTsConfig,
} from './utils/update-files';
import { updateProjectJsonWithHtmlReport } from './utils/update-targets';

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
            '@cypress/grep': CYPRESSGREP_VERSION,
        },
    );
}

export default async function initGenerator(
    tree: Tree,
    options: CypressGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'CypressInit'))
        return false;
    const normalizedOptions = normalizeOptions(tree, options);

    const cypressGeneratorConfiguration: CypressE2EConfigSchema = {
        project: normalizedOptions.projectName,
        directory: 'cypress',
        linter: Linter.EsLint,
    };

    await cypressE2EConfigurationGenerator(tree, cypressGeneratorConfiguration);
    // update application eslint.rc
    updateApplicationLintFile(tree, normalizedOptions.projectRoot);
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
    tree.delete(
        joinPathFragments(normalizedOptions.projectRoot, 'tsconfig.cy.json'),
    );
    addFiles(
        tree,
        joinPathFragments('files', 'e2e-folder'),
        __dirname,
        normalizedOptions.projectRoot,
        normalizedOptions,
    );
    if (!existsSync(joinPathFragments(tree.root, 'cypress.config.base.ts'))) {
        addFiles(
            tree,
            joinPathFragments('files', 'root'),
            __dirname,
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
