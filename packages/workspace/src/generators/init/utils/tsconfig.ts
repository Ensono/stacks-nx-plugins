import path from 'path';

import { generateFiles, Tree } from '@nx/devkit';

export function createTsConfigBase(tree: Tree) {
    if (!tree.exists('tsconfig.base.json')) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'tsconfig'),
            '',
            { template: '' },
        );
    }
}
