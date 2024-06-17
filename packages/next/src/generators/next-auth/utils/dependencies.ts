import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

import { NEXT_AUTH_VERSION, IOREDIS_VERSION } from './constants';
import { NextAuthGeneratorSchema } from '../schema';

export function installDependencies(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const dependencies: Record<string, string> = {
        'next-auth': NEXT_AUTH_VERSION,
    };

    if (options.sessionStorage === 'redis') {
        dependencies.ioredis = IOREDIS_VERSION;
    }
    return addDependenciesToPackageJson(tree, dependencies, {});
}
