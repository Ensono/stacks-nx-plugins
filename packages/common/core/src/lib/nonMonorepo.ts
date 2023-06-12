import { Tree, getProjects } from '@nrwl/devkit';

import { findFile } from './findFile';

/**
 *
 * @param {number} tree the file system tree
 * @param {number} project unique name of the selected project/application
 *
 */

export function nonMonorepo(tree: Tree, project: string) {
    const getProject = getProjects(tree).get(project);

    const isRootWorkspace =
        getProject?.root === '.' && getProject?.projectType === 'library';
    const findNxJson = findFile('nx.json', './');
    const findApps = findFile('apps', './');

    const isNonMonorepo = !(findNxJson && findApps) && isRootWorkspace;

    return isNonMonorepo;
}
