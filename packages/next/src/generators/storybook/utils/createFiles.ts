import path from 'path';

import { generateFiles, Tree } from '@nx/devkit';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const createFiles = (tree: Tree, project: ProjectConfiguration) => {
    generateFiles(tree, path.join(__dirname, `../files`), project.root, {
        dot: '.',
        tmpl: '',
    });

    return () => {};
};
