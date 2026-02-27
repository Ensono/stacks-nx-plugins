import {
    addDependenciesToPackageJson,
    updateJson,
    Tree,
    getPackageManagerCommand,
} from '@nx/devkit';

import { HUSKY_VERSION, PACKAGE_JSON } from './constants';
import { PackageJson } from './types';
import { InstallGeneratorSchema } from '../schema';

function addHuskyPrepareScript(tree: Tree) {
    updateJson(tree, PACKAGE_JSON, (json: PackageJson) => {
        const update = json;

        update.scripts = {
            ...json.scripts,
            prepare: 'husky',
        };

        return update;
    });
}

function addHuskyDependency(tree: Tree) {
    return addDependenciesToPackageJson(tree, {}, { husky: HUSKY_VERSION });
}

function getOrCreateHook(tree: Tree, path: string) {
    const hasHook: boolean = tree.exists(path);

    if (!hasHook) {
        tree.write(path, '');

        return '';
    }

    return tree.read(path)?.toString();
}

function addPreCommit(tree: Tree) {
    const path = '.husky/pre-commit';
    const pm = getPackageManagerCommand();
    const lintStaged = 'lint-staged';
    const contents = getOrCreateHook(tree, path);
    const updatedPreCommit = [contents];

    if (!contents?.includes(lintStaged)) {
        updatedPreCommit.push(`${pm.exec} ${lintStaged}`);
    }

    tree.write(path, updatedPreCommit.join('\n'), { mode: '775' });
}

function addCommitMessage(tree: Tree) {
    const path = '.husky/commit-msg';
    const pm = getPackageManagerCommand();
    const commitMessage = `commitlint --edit "$1"`;
    const contents = getOrCreateHook(tree, path);
    const updateCommitMessage = [contents];

    if (!contents?.includes('commitlint')) {
        updateCommitMessage.push(`${pm.exec} ${commitMessage}`);
    }
    tree.write(path, updateCommitMessage.join('\n'), { mode: '775' });
}

export function addHusky(tree: Tree, options: InstallGeneratorSchema) {
    const hasHusky = tree.exists('.husky/_/husky.sh');

    if (!hasHusky) {
        addHuskyPrepareScript(tree);
    }

    addPreCommit(tree);

    if (options.commitizen) {
        addCommitMessage(tree);
    }

    return addHuskyDependency(tree);
}
