import {
    addIgnoreEntry,
    hasGeneratorExecutedForWorkspace,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    formatFiles,
    GeneratorCallback,
    Tree,
    runTasksInSerial,
} from '@nx/devkit';

import { InitDeploymentGeneratorSchema } from './schema';
import { addPipeline } from './utils/pipeline';
import { setDefaults } from './utils/set-defaults';

export default async function initDeploymentGenerator(
    tree: Tree,
    options: InitDeploymentGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    if (hasGeneratorExecutedForWorkspace(tree, 'WorkspaceDeployment'))
        return false;

    const tasks: GeneratorCallback[] = [];

    // Add pipeline code to workspace
    tasks.push(addPipeline(tree, options));

    // Update git ignore
    addIgnoreEntry(tree, '.gitignore', 'Docker', ['.nx-container']);

    // Add target to nx.json
    setDefaults(tree, options);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
