import { addDependenciesToPackageJson, updateJson, Tree } from '@nrwl/devkit';
import { HUSKY_VERSION, PACKAGE_JSON } from './constants';
import { InstallGeneratorSchema } from '../schema';

import { PackageJson } from './types';

const HOOK_PREAMBLE = `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n`;

function addHuskyPrepareScript(tree: Tree) {
  updateJson(tree, PACKAGE_JSON, (packageJson: PackageJson) => {
    packageJson.scripts = {
      ...packageJson.scripts,
      ...{ prepare: 'husky install' },
    };

    return packageJson;
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
  } else {
    const contents = tree.read(path);
    return contents;
  }
}

function addPreCommit(tree: Tree) {
  const path = './husky/pre-commit';
  const preCommit = 'npx nx affected:lint --uncommitted';

  const contents = getOrCreateHook(tree, path);

  if (!contents.includes('lint')) {
    tree.write(path, `${contents}\n${preCommit}`, { mode: '0o775' });
  }
}

function addCommitMsg(tree: Tree) {
  const path = './husky/commit-msg';
  const commitMsg = `npx --no-install commitlint --edit "$1"`;

  const contents = getOrCreateHook(tree, path);

  if (!contents.includes('commitlint')) {
    tree.write(path, `${contents}\n${commitMsg}`, { mode: '0o775' });
  }
}

function addPrepareCommitMsg(tree: Tree) {
  const path = './husky/prepare-commit-msg';
  const prepareCommitMsg = `exec < /dev/tty && npx cz --hook || true`;

  const contents = getOrCreateHook(tree, path);

  if (!contents.includes('cz --hook')) {
    tree.write(path, `${contents}\n${prepareCommitMsg}`, { mode: '0o775' });
  }
}

export function addHusky(tree: Tree, options: InstallGeneratorSchema) {
  const hasHusky = tree.exists('.husky/_/husky.sh');

  if (!hasHusky) {
    addHuskyPrepareScript(tree);
    addPreCommit(tree);

    if (options.commitizen) {
      addCommitMsg(tree);
      addPrepareCommitMsg(tree);
    }
  }
  return addHuskyDependency(tree);
}
