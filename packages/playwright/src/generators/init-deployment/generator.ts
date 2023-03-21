import { formatFiles, Tree } from '@nrwl/devkit';

import { updateAzureDevopsStages } from './utils/update-azdevops-build';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';

export default async function initDeploymentGenerator(tree: Tree) {
    updateTaskctlYaml(tree);
    updateTasksYaml(tree);
    updateAzureDevopsStages(tree);

    await formatFiles(tree);
}
