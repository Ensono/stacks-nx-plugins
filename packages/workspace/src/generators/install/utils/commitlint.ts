import * as path from 'path';
import {
  addDependenciesToPackageJson,
  Tree,
  readJson,
  generateFiles,
} from '@nrwl/devkit';

import {
  COMMITLINT_CLI_VERSION,
  COMMITLINT_CONFIG_CONVENTIONAL_VERSION,
  COMMITLINT_CONFIG_NX_SCOPES_VERSION,
  PACKAGE_JSON,
} from './constants';

function addCommitlintDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      '@commitlint/cli': COMMITLINT_CLI_VERSION,
      '@commitlint/config-conventional': COMMITLINT_CONFIG_CONVENTIONAL_VERSION,
      '@commitlint/config-nx-scopes': COMMITLINT_CONFIG_NX_SCOPES_VERSION,
    }
  );
}

export function addCommitlint(tree: Tree) {
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
      tree.root,
      {}
    );
    return addCommitlintDependencies(tree);
  }
}
