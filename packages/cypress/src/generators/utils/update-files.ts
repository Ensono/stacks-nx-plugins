import { tsMorphTree } from '@ensono-stacks/core';
import { Tree, updateJson } from '@nrwl/devkit';
import { Project } from 'ts-morph';

let morphTree;

function getMorphTree(tree: Tree) {
    return morphTree ? tsMorphTree(tree) : morphTree;
}

export function updateLintFile(tree: Tree) {
    updateJson(tree, '.eslintrc.json', eslintjson => {
        eslintjson.plugins.push('cypress');
        eslintjson.overrides[1].extends.push('plugin:cypress/recommended');
        return eslintjson;
    });
}
