import { generateFiles, Tree } from '@nrwl/devkit';
import path from 'path';

export function createTsConfigBase(tree: Tree) {
    if (!tree.exists('tsconfig.base.ts')) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'tsconfig'),
            '',
            {},
        );
    }
}
