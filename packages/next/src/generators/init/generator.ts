import { formatFilesWithEslint } from '@ensono-stacks/core';
import {
    formatFiles,
    GeneratorCallback,
    readProjectConfiguration,
    updateJson,
    Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import path from 'path';

import infrastructureGenerator from '../infrastructure/generator';
import { NextGeneratorSchema } from './schema';
import createCustomTestConfig from './utils/createCustomTestConfig';
import { addEslint } from './utils/eslint';
import updateTsConfig from './utils/tsconfig';

export default async function initGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const project = readProjectConfiguration(tree, options.project);

    tasks.push(addEslint(tree, project.root));

    if (options.infra) {
        tasks.push(
            await infrastructureGenerator(tree, { project: options.project }),
        );
    }

    tasks.push(addEslint(tree, project.sourceRoot));

    await createCustomTestConfig(tree, project.sourceRoot);

    await formatFiles(tree);

    tasks.push(formatFilesWithEslint(options.project));

    // update tsconfig.json
    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.json'),
        ['next.config.js'],
    );

    // update tsconfig.spec.json
    updateTsConfig(
        tree,
        project,
        path.join(project.sourceRoot, 'tsconfig.spec.json'),
    );

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
