import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
    updateJson,
    joinPathFragments,
} from '@nrwl/devkit';
import { addTerminalLogging, terminalLogAxeBody, updateCypressConfig } from './utils/update-files';
import path, { join } from 'path';
import { Project } from 'ts-morph';
import { option } from 'yargs';

import {
    normalizeOptions,
    NormalizedSchema,
    addFiles,
} from '../../utils/test-utils';
import { AXECORE, CYPRESSAXE } from '../../versions';
import { AccessibilityGeneratorSchema } from './schema';

async function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            'axe-core': AXECORE,
            'cypress-axe': CYPRESSAXE,
        },
    );
}

function updateTsConfig(tree: Tree, project: string) {
    updateJson(
        tree,
        joinPathFragments(project, 'tsconfig.cy.json'),
        tsConfigJson => {
            const updatedProjectJson = { ...tsConfigJson };
            if (
                !updatedProjectJson.compilerOptions.types.includes(
                    'cypress-axe',
                )
            ) {
                updatedProjectJson.compilerOptions.types.push('cypress-axe');
            }
            return updatedProjectJson;
        },
    );
}

export default async function accessibilityGenerator(
    tree: Tree,
    options: AccessibilityGeneratorSchema,
) {
    const normalizedOptions = normalizeOptions(tree, options);

    // generate acessiblity files
    addFiles(
        tree,
        'files',
        __dirname,
        normalizedOptions.projectRoot,
        normalizedOptions,
    );

    // update ts config
    updateTsConfig(tree, normalizedOptions.projectRoot);

    updateCypressConfig(tree, normalizedOptions.projectRoot);

    // add terminal logging funcitonality to e2e.ts
    addTerminalLogging(tree, normalizedOptions.cypressProject);
    await formatFiles(tree);

    return updateDependencies(tree);
}
