import {
    addDependenciesToPackageJson,
    generateFiles,
    Tree,
} from '@nrwl/devkit';
import path from 'path';

import { LINT_STAGED_VERSION } from './constants';

function addLintStagedDependency(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        { 'lint-staged': LINT_STAGED_VERSION },
    );
}

export function addLintStaged(tree: Tree) {
    if (!tree.exists('lint-staged.config.js')) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'lintstaged'),
            '',
            { template: '' },
        );
    }

    return addLintStagedDependency(tree);
}
