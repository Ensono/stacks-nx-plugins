import { generateFiles, Tree } from '@nrwl/devkit';
import path from 'path';

export function addTsConfigBase(tree: Tree) {
    const hasConfig = tree.exists('tsconfig.base.ts');

    const templateOptions = {
        template: '',
    };

    if (!hasConfig) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'tsconfig'),
            '',
            templateOptions,
        );
    }
}
