import {
    addIgnoreEntry,
    deploymentGeneratorMessage,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { cypressE2EConfigurationGenerator } from '@nx/cypress';
import { CypressE2EConfigSchema } from '@nx/cypress/src/generators/configuration/configuration';
import {
    formatFiles,
    Tree,
    readProjectConfiguration,
    addDependenciesToPackageJson,
    runTasksInSerial,
    joinPathFragments,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { libraryGenerator } from '@nx/js';

import { CypressGeneratorSchema } from './schema';
import {
    updateBaseTsConfig,
    updateApplicationLintFile,
    updateTsConfig,
} from './utils/update-files';
import { updateProjectJsonWithHtmlReport } from './utils/update-targets';
import { addFiles, normalizeOptions } from '../../utils/test-utils';
import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    NXCYPRESS_VERSION,
    CYPRESSGREP_VERSION,
} from '../../versions';

function updateDependencies(tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            cypress: CYPRESS_VERSION,
            '@nx/cypress': NXCYPRESS_VERSION,
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

    const projectE2EName = `${normalizedOptions.project}-e2e`;

    const cypressGeneratorConfiguration: CypressE2EConfigSchema = {
        project: projectE2EName,
        directory: 'src',
        linter: Linter.EsLint,
        devServerTarget: `${normalizedOptions.projectName}:serve-static`,
    };

    await libraryGenerator(tree, {
        name: projectE2EName,
        directory: `apps/${projectE2EName}`,
        projectNameAndRootFormat: 'as-provided',
    });

    await cypressE2EConfigurationGenerator(tree, cypressGeneratorConfiguration);
    // update application eslint.rc
    updateApplicationLintFile(tree, normalizedOptions.cypressProject);
    // update ts config
    updateTsConfig(tree, normalizedOptions.cypressProject);
    updateBaseTsConfig(tree);

    // update targets
    updateProjectJsonWithHtmlReport(
        normalizedOptions.cypressProject,
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
