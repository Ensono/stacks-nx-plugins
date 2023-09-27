import { generateFiles, Tree } from '@nx/devkit';
import path from 'path';

import { NextGeneratorSchema } from '../schema';

function createReadmeFile(tree: Tree, options: NextGeneratorSchema) {
    generateFiles(
        tree, // the virtual file system
        path.join(__dirname, '..', 'files', 'readme'),
        '',
        {
            template: '',
            hasProjectName: false,
            projectName: options.project,
        },
    );
}

export function modifyReadme(tree: Tree, options: NextGeneratorSchema) {
    const readmePath = path.join(__dirname, 'README.md');

    if (!tree.exists(readmePath)) {
        createReadmeFile(tree, options);
    }
}
