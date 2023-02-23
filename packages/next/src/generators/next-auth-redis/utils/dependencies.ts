import { addDependenciesToPackageJson, Tree } from '@nrwl/devkit';

import {
    IOREDIS_MOCK_VERSION,
    IOREDIS_VERSION,
    TYPES_IOREDIS_MOCK_VERSION,
    TYPES_UUID_VERSION,
    UUID_VERSION,
} from './constants';

export function installDependencies(tree: Tree) {
    const dependencies = {
        ioredis: IOREDIS_VERSION,
        uuid: UUID_VERSION,
    };
    const devDependencies = {
        '@types/ioredis-mock': TYPES_IOREDIS_MOCK_VERSION,
        '@types/uuid': TYPES_UUID_VERSION,
        'ioredis-mock': IOREDIS_MOCK_VERSION,
    };

    return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}
