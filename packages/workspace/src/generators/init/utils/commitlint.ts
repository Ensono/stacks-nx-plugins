import {
    addDependenciesToPackageJson,
    Tree,
    readJson,
    generateFiles,
} from '@nx/devkit';
import path from 'path';

import {
    COMMITLINT_CLI_VERSION,
    COMMITLINT_CONFIG_CONVENTIONAL_VERSION,
    PACKAGE_JSON,
} from './constants';

function addCommitlintDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@commitlint/cli': COMMITLINT_CLI_VERSION,
            '@commitlint/config-conventional':
                COMMITLINT_CONFIG_CONVENTIONAL_VERSION,
        },
    );
}

function addCommitlintConfig(tree: Tree) {
    const packageJson = readJson(tree, PACKAGE_JSON);

    const hasConfig =
        packageJson.commitlint ||
        tree.exists('commitlint.config.js') ||
        tree.exists('commitlint') ||
        tree.exists('.commitlintrc.js') ||
        tree.exists('.commitlintrc.json') ||
        tree.exists('.commitlintrc.yml');

    if (!hasConfig) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'commitlint'),
            '',
            {},
        );
    }
}

export function addCommitlint(tree: Tree) {
    addCommitlintConfig(tree);

    return addCommitlintDependencies(tree);
}
