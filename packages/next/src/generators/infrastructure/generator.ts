import { StacksConfigError } from '@ensono-stacks/core';
import {
    formatFiles,
    readProjectConfiguration,
    GeneratorCallback,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import chalk from 'chalk';

import { NextGeneratorSchema } from './schema';
import { addInfrastructure } from './utils/add-infrastructure';

export default async function infrastructureGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    try {
        tasks.push(...addInfrastructure(tree, project));
    } catch (error) {
        if (error instanceof StacksConfigError) {
            console.warn(chalk.yellow`Missing Stacks configuration in nx.json`);
            console.log(
                '  Infrastructure code will not be applied now, but you can rerun this task when you update the configuration.',
            );
            console.log(
                '    nx g @ensono-stacks/next:infrastructure --project [project_name]',
            );
            return () => {};
        }

        throw error;
    }

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
