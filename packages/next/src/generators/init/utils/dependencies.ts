import {
    GeneratorCallback,
    ProjectConfiguration,
    Tree,
    addDependenciesToPackageJson,
} from '@nx/devkit';

import { EXPRESS_VERSION, TYPES_EXPRESS_VERSION } from './constants';

export function updateDependencies(
    tree: Tree,
    project: ProjectConfiguration,
): GeneratorCallback {
    const customServer = project.targets?.['build-custom-server'];

    if (customServer) {
        return addDependenciesToPackageJson(
            tree,
            {
                express: EXPRESS_VERSION,
            },
            {
                '@types/express': TYPES_EXPRESS_VERSION,
            },
        );
    }

    return () => {};
}
