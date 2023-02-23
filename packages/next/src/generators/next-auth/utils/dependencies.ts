import { addDependenciesToPackageJson, Tree } from '@nrwl/devkit';

import { NEXT_AUTH_VERSION } from './constants';

export function installDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            'next-auth': NEXT_AUTH_VERSION,
        },
        {},
    );
}
