import { Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { readStacksExecutedGenerators } from '../lib/stacks';

export function executedDependantGenerator(tree: Tree, generatorName: string) {
    const generatorExecuted =
        readStacksExecutedGenerators(tree).workspace.includes(generatorName);

    if (!generatorExecuted) {
        console.log(
            '\n',
            chalk.yellow`The following generator is required as a prerequisite for this generator to work:`,
            chalk.magenta`${generatorName}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
    }

    return generatorExecuted;
}
