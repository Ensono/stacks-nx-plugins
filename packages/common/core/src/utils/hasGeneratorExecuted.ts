import { Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { readStacksExecutedGenerators } from '../lib/stacks';
import { tagExecutedGenerator } from './tagExecutedGenerator';

export function hasGeneratorExecuted(
    tree: Tree,
    projectName: string,
    generatorName: string,
) {
    const stacksExecutedGenerators = readStacksExecutedGenerators(tree);

    const generatorExecuted = stacksExecutedGenerators.includes(generatorName);

    if (!generatorExecuted) {
        tagExecutedGenerator(tree, generatorName);
    } else {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the project`,
            chalk.magenta`${projectName}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
    }

    return generatorExecuted;
}
