import path from 'path';

import { generateFiles, ProjectConfiguration, Tree } from '@nx/devkit';

function createReadmeFile(tree: Tree, project: ProjectConfiguration) {
    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', 'readme'),
        project.root,
        {
            template: '',
            hasProjectName: false,
            projectName: project.name,
        },
    );
}

export function modifyReadme(tree: Tree, project: ProjectConfiguration) {
    const readmePath = path.join(__dirname, 'README.md');

    if (!tree.exists(readmePath)) {
        createReadmeFile(tree, project);
    }
}
