import { hasGeneratorExecutedForWorkspace } from '@ensono-stacks/core';
import { formatFiles, GeneratorCallback, Tree } from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';

import { InitDeploymentGeneratorSchema } from './schema';
import { addPipeline } from './utils/pipeline';
import { setDefaults } from './utils/set-defaults';

export default async function initDeploymentGenerator(
    tree: Tree,
    options: InitDeploymentGeneratorSchema,
) {
    if (hasGeneratorExecutedForWorkspace(tree, 'WorkspaceDeployment'))
        return false;

    const tasks: GeneratorCallback[] = [];

    // Add pipeline code to workspace
    tasks.push(addPipeline(tree, options));

    // Add target to nx.json
    setDefaults(tree, options);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
