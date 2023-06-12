import {
    hasGeneratorExecutedForProject,
    isGeneratorInExecutedListForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    Tree,
    updateJson,
    joinPathFragments,
} from '@nrwl/devkit';

import { normalizeOptions, addFiles } from '../../utils/test-utils';
import { AXECORE_VERSION, CYPRESSAXE_VERSION } from '../../versions';
import { AccessibilityGeneratorSchema } from './schema';
import { addTerminalLogging, updateCypressConfig } from './utils/update-files';

async function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            'axe-core': AXECORE_VERSION,
            'cypress-axe': CYPRESSAXE_VERSION,
        },
    );
}

function updateTsConfig(tree: Tree, project: string) {
    updateJson(
        tree,
        joinPathFragments(project, 'tsconfig.json'),
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
    verifyPluginCanBeInstalled(tree, options.project);

    const normalizedOptions = normalizeOptions(tree, options);
    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'CypressAccessibility',
        )
    )
        return false;
    isGeneratorInExecutedListForProject(
        tree,
        options.project,
        'CypressInit',
        true,
    );

    // generate acessiblity files
    addFiles(
        tree,
        'files',
        __dirname,
        normalizedOptions.projectRoot,
        normalizedOptions,
    );

    // update ts config
    updateTsConfig(tree, normalizedOptions.cypressProject);

    updateCypressConfig(tree, normalizedOptions.projectRoot);

    // add terminal logging funcitonality to e2e.ts
    addTerminalLogging(tree, normalizedOptions.cypressProject);
    await formatFiles(tree);

    return updateDependencies(tree);
}
