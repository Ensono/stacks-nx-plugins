import {
  addDependenciesToPackageJson,
  Tree,
  readJson,
  updateJson,
} from '@nrwl/devkit';

import { PackageJson } from './types';
import { InstallGeneratorSchema } from '../schema';

import {
  COMMITIZEN_VERSION,
  COMMITLINT_CZ_COMMITLINT_VERSION,
  PACKAGE_JSON,
} from './constants';

function addCommitizenDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      commitizen: COMMITIZEN_VERSION,
      '@commitlint/cz-commitlint': COMMITLINT_CZ_COMMITLINT_VERSION,
    }
  );
}

export function addCommitizen(tree: Tree, options: InstallGeneratorSchema) {
  const packageJson = readJson(tree, PACKAGE_JSON) as PackageJson;
  const hasConfig =
    packageJson.config?.commitizen ||
    tree.exists('.czrc') ||
    tree.exists('.cz.json');

  if (!hasConfig) {
    updateJson(tree, PACKAGE_JSON, (json: PackageJson) => {
      if (!options.husky) {
        json.scripts.commit = 'cz';
      }
      json.config.commitizen = { path: '@commitlint/cz-commitlint' };
      return json;
    });
    return addCommitizenDependencies(tree);
  }
}
