import { formatFilesWithEslint } from '@ensono-stacks/core';
import {
    formatFiles,
    getProjects,
    GeneratorCallback,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(
            `Cannot find the ${options.project} project. Please double check the project name.`,
        );
    }

    tasks.push(addEslint(tree, project.sourceRoot));

    await formatFiles(tree);

    tasks.push(formatFilesWithEslint(options.project));

    return runTasksInSerial(...tasks);
}
