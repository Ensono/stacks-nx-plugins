import { StacksConfigError } from '@ensono-stacks/core';
import {
    joinPathFragments,
    readProjectConfiguration,
    GeneratorCallback,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import chalk from 'chalk';

import { NextGeneratorSchema } from './schema';
import { addInfrastructure } from './utils/add-infrastructure';
import { formatFiles } from './utils/format-files';

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

    // exclude helm yaml files from initial format when generating the files
    await formatFiles(tree, [
        joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),
    ]);

    return runTasksInSerial(...tasks);
}
