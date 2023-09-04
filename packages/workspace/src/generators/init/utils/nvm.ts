import { GeneratorCallback, Tree } from '@nx/devkit';

import { NODE_LTS } from './constants';

const pathToFile = '.nvmrc';

function updateNVMFile(tree: Tree) {
    tree.write(pathToFile, NODE_LTS, { mode: '775' });
}

function addRules(tree: Tree) {
    updateNVMFile(tree);
}

export function addNVM(tree: Tree): GeneratorCallback {
    addRules(tree);

    return () => {};
}
