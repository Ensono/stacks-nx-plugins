import {
    executedDependantGenerator,
    hasGeneratorExecutedForWorkspace,
} from '@ensono-stacks/core';
import { formatFiles, Tree } from '@nrwl/devkit';

import { updateAzureDevopsStages } from './utils/update-azdevops-build';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';

// eslint-disable-next-line consistent-return
export default async function initDeploymentGenerator(tree: Tree) {
    if (!executedDependantGenerator(tree, 'WorkspaceDeployment')) return false;
    if (hasGeneratorExecutedForWorkspace(tree, 'CypressInitDeployment'))
        return false;

    updateTaskctlYaml(tree);
    updateTasksYaml(tree);
    updateAzureDevopsStages(tree);

    await formatFiles(tree);
}