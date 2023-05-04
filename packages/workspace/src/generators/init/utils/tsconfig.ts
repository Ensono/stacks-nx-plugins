import { generateFiles, Tree } from '@nx/devkit';
import path from 'path';

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
