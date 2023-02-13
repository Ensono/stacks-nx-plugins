import { addDependenciesToPackageJson, Tree } from '@nrwl/devkit';

import {
    IOREDIS_VERSION,
    NEXT_AUTH_VERSION,
    TYPES_UUID_VERSION,
    UUID_VERSION,
} from './constants';

export function installDependencies(
    tree: Tree,
    { addRedis }: { addRedis?: boolean } = {},
) {
    let dependencies: any = {
        'next-auth': NEXT_AUTH_VERSION,
    };
    let devDependencies = {};

    if (addRedis) {
        dependencies = {
            ...dependencies,
            ioredis: IOREDIS_VERSION,
            uuid: UUID_VERSION,
        };
        devDependencies = {
            ...devDependencies,
            '@types/uuid': TYPES_UUID_VERSION,
        };
    }

    return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}
