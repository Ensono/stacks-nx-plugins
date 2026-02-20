import { Tree, getProjects } from '@nx/devkit';

import { findFile } from './findFile';

/**
 *
 * @param {number} tree the file system tree
 * @param {number} project unique name of the selected project/application
 *
 */

export function verifyPluginCanBeInstalled(tree: Tree, project?: string) {
    let isRootWorkspace = false;
    const getAllProjects = getProjects(tree);

    const errorMessage =
        'Stacks plugins can only be used inside an Nx Monorepo. It looks like the project you selected is a non-monorepo, if you believe this to be an error please raise an issue!';
    const proj = getAllProjects.entries().next().value;

    if (getAllProjects.size === 1 && proj && proj[1].root === '.') {
        throw new Error(errorMessage);
    }

    if (project) {
        const getProject = getAllProjects.get(project);

        isRootWorkspace =
            getProject?.root === '.' && getProject?.projectType === 'library';
    }

    const findNxJson = findFile('nx.json', './');
    const findApps = findFile('apps', './');
    const isNonMonorepo = !(findNxJson && findApps) && isRootWorkspace;

    if (isNonMonorepo) {
        throw new Error(errorMessage);
    } else {
        return true;
    }
}
