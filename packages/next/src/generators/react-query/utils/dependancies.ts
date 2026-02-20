import { addDependenciesToPackageJson, Tree } from '@nx/devkit';
import { GeneratorCallback } from 'nx/src/config/misc-interfaces';

import {
    REACT_QUERY_ESLINT_NPM_PACKAGE_NAME,
    REACT_QUERY_ESLINT_VERSION,
    REACT_QUERY_NPM_PACKAGE_NAME,
    REACT_QUERY_VERSION,
} from './constants';
import { ReactQueryGeneratorSchema } from '../schema';

export function installDependencies(
    tree: Tree,
    options: ReactQueryGeneratorSchema,
): GeneratorCallback {
    if (options.skipPackageJson) {
        return () => void 0;
    }

    return addDependenciesToPackageJson(
        tree,
        {
            [REACT_QUERY_NPM_PACKAGE_NAME]: REACT_QUERY_VERSION,
        },
        {
            [REACT_QUERY_ESLINT_NPM_PACKAGE_NAME]: REACT_QUERY_ESLINT_VERSION,
        },
    );
}
