import { addDependenciesToPackageJson, updateJson, Tree } from '@nrwl/devkit';

import { InstallGeneratorSchema } from '../schema.d';
import { HUSKY_VERSION, PACKAGE_JSON } from './constants';
import { PackageJson } from './types';

const HOOK_PREAMBLE = `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n`;

function addHuskyPrepareScript(tree: Tree) {
    updateJson(tree, PACKAGE_JSON, (json: PackageJson) => {
        const update = json;
        update.scripts = {
            ...json.scripts,
            prepare: 'husky install',
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
        tree.write(path, `${HOOK_PREAMBLE}`);
        return HOOK_PREAMBLE;
    }
    return tree.read(path);
}

function addPreCommit(tree: Tree) {
    const path = '.husky/pre-commit';
    const preCommit = 'npx nx affected:lint --uncommitted';

    const contents = getOrCreateHook(tree, path);

    if (!contents?.includes('lint')) {
        tree.write(path, `${contents}\n${preCommit}`, { mode: '775' });
    }
}

function addCommitMessage(tree: Tree) {
    const path = '.husky/commit-msg';
    const commitMessage = `npx --no-install commitlint --edit "$1"`;

    const contents = getOrCreateHook(tree, path);

    if (!contents?.includes('commitlint')) {
        tree.write(path, `${contents}\n${commitMessage}`, { mode: '775' });
    }
}

function addPrepareCommitMessage(tree: Tree) {
    const path = '.husky/prepare-commit-msg';
    const prepareCommitMessage = `exec < /dev/tty && npx cz --hook || true`;

    const contents = getOrCreateHook(tree, path);

    if (!contents?.includes('cz --hook')) {
        tree.write(path, `${contents}\n${prepareCommitMessage}`, {
            mode: '775',
        });
    }
}

export function addHusky(tree: Tree, options: InstallGeneratorSchema) {
    const hasHusky = tree.exists('.husky/_/husky.sh');

    if (!hasHusky) {
        addHuskyPrepareScript(tree);
    }

    addPreCommit(tree);

    if (options.commitizen) {
        addCommitMessage(tree);
        addPrepareCommitMessage(tree);
    }

    return addHuskyDependency(tree);
}
