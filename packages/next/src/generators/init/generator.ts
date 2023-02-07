import { formatFilesWithEslint } from '@ensono-stacks/core';
import {
    formatFiles,
    readProjectConfiguration,
    GeneratorCallback,
    Tree,
    updateProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import infrastructureGenerator from '../infrastructure/generator';
import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    const update = { ...project };

    if (
        project.sourceRoot ===
        update.targets.build.configurations.development.outputPath
    ) {
        update.targets.build.configurations.development = {};
    }

    updateProjectConfiguration(tree, project.name, update);

    tasks.push(addEslint(tree, project.root));

    if (options.infra) {
        tasks.push(
            await infrastructureGenerator(tree, { project: options.project }),
        );
    }

    tasks.push(formatFilesWithEslint(options.project));

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
