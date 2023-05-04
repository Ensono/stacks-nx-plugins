import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

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
