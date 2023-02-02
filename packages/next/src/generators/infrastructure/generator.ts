import {
    formatFiles,
    readProjectConfiguration,
    GeneratorCallback,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { NextGeneratorSchema } from './schema';
import { addInfrastructure } from './utils/add-infrastructure';

export default async function infrastructureGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    tasks.push(...addInfrastructure(tree, project));

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
