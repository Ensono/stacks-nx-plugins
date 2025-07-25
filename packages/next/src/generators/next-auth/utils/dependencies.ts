import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

import { NextAuthGeneratorSchema } from '../schema';

import {
    NEXT_AUTH_VERSION,
    IOREDIS_VERSION,
    UUID_VERSION,
    TYPES_UUID_VERSION,
    AUTH_CORE_VERSION,
    OAUTH_4_WEBAPI_VERSION,
} from './constants';

export function installDependencies(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const dependencies: Record<string, string> = {
        'next-auth': NEXT_AUTH_VERSION,
        '@auth/core': AUTH_CORE_VERSION,
        oauth4webapi: OAUTH_4_WEBAPI_VERSION,
    };

    const devDependencies: Record<string, string> = {};

    if (options.sessionStorage === 'redis') {
        dependencies.ioredis = IOREDIS_VERSION;
        dependencies.uuid = UUID_VERSION;
        devDependencies['@types/uuid'] = TYPES_UUID_VERSION;
    }
    return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}
