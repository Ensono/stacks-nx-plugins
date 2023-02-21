import { addDependenciesToPackageJson, Tree } from '@nrwl/devkit';

import { IOREDIS_VERSION, TYPES_UUID_VERSION, UUID_VERSION } from './constants';

export function installDependencies(tree: Tree) {
    const dependencies = {
        ioredis: IOREDIS_VERSION,
        uuid: UUID_VERSION,
    };
    const devDependencies = {
        '@types/uuid': TYPES_UUID_VERSION,
    };

    return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}
