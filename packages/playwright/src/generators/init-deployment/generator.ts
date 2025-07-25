import {
    executedDependantGenerator,
    hasGeneratorExecutedForWorkspace,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { formatFiles, Tree } from '@nx/devkit';

import { updateAzureDevopsStages } from './utils/update-azdevops-build';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';

export default async function initDeploymentGenerator(tree: Tree) {
    verifyPluginCanBeInstalled(tree);

    if (!executedDependantGenerator(tree, 'WorkspaceDeployment')) return false;
    if (hasGeneratorExecutedForWorkspace(tree, 'PlaywrightInitDeployment'))
        return false;

    updateTaskctlYaml(tree);
    updateTasksYaml(tree);
    updateAzureDevopsStages(tree);

    await formatFiles(tree);
}
