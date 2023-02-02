import { formatFilesWithEslint } from '@ensono-stacks/core';
import {
    formatFiles,
    readProjectConfiguration,
    GeneratorCallback,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';
import { addInfrastructure } from './utils/infrastructure/add-infrastructure';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    tasks.push(addEslint(tree, project.root));

    if (options.infra) {
        tasks.push(...addInfrastructure(tree, project));
    }

    tasks.push(formatFilesWithEslint(options.project));

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
