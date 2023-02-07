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
import { addEslint } from './utils/eslint';

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

    tasks.push(formatFilesWithEslint(options.project));

    updateJson(
        tree,
        path.join(project.sourceRoot, 'tsconfig.json'),
        tsconfig => {
            const update = tsconfig;
            update.include = [
                ...new Set([
                    ...(update.include || []),
                    '**/*.ts',
                    '**/*.tsx',
                    '**/*.spec.tsx',
                    'next.config.js',
                ]),
            ];
            return update;
        },
    );

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
