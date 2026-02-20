import { generateFiles, Tree } from '@nx/devkit';
import path from 'path';

function createReadmeFile(tree: Tree) {
    generateFiles(
        tree, // the virtual file system
        path.join(__dirname, '..', 'files', 'readme'),
        '',
        {
            template: '',
            hasProjectName: false,
            projectName: '',
        },
    );
}

export function modifyReadme(tree: Tree) {
    const readmePath = path.join(__dirname, 'README.md');

    if (!tree.exists(readmePath)) {
        createReadmeFile(tree);
    }
}
