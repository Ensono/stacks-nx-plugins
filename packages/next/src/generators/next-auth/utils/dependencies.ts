import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

import {
    NEXT_AUTH_VERSION,
    IOREDIS_VERSION,
    UUID_VERSION,
    TYPES_UUID_VERSION,
} from './constants';
import { NextAuthGeneratorSchema } from '../schema';

export function installDependencies(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const dependencies: Record<string, string> = {
        'next-auth': NEXT_AUTH_VERSION,
    };

    const devDependencies: Record<string, string> = {};

    if (options.sessionStorage === 'redis') {
        dependencies.ioredis = IOREDIS_VERSION;
        dependencies.uuid = UUID_VERSION;
        devDependencies['@types/uuid'] = TYPES_UUID_VERSION;
    }
    return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}
