import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

import {REACT_QUERY_NPM_PACKAGE_NAME, REACT_QUERY_VERSION} from './constants';

export function installDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            REACT_QUERY_NPM_PACKAGE_NAME: REACT_QUERY_VERSION,
        },
        {},
    );
}
