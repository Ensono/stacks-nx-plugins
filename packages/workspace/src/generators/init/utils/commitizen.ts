import {
    addDependenciesToPackageJson,
    Tree,
    readJson,
    updateJson,
} from '@nrwl/devkit';

import { InstallGeneratorSchema } from '../schema';
import {
    COMMITIZEN_VERSION,
    COMMITLINT_CZ_COMMITLINT_VERSION,
    PACKAGE_JSON,
} from './constants';
import { PackageJson } from './types';

function addCommitizenDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            commitizen: COMMITIZEN_VERSION,
            '@commitlint/cz-commitlint': COMMITLINT_CZ_COMMITLINT_VERSION,
        },
    );
}

function addCommitizenConfig(tree: Tree, options: InstallGeneratorSchema) {
    const packageJson = readJson(tree, PACKAGE_JSON) as PackageJson;
    const hasConfig =
        packageJson.config?.commitizen ||
        tree.exists('.czrc') ||
        tree.exists('.cz.json');

    if (!hasConfig) {
        updateJson(tree, PACKAGE_JSON, (json: PackageJson) => {
            const update = json;
            if (!options.husky) {
                update.scripts = {
                    ...update.scripts,
                    commit: 'cz',
                };
            }
            update.config = {
                ...update.config,
                commitizen: { path: '@commitlint/cz-commitlint' },
            };
            return update;
        });
    }
}

export function addCommitizen(tree: Tree, options: InstallGeneratorSchema) {
    addCommitizenConfig(tree, options);

    return addCommitizenDependencies(tree);
}
