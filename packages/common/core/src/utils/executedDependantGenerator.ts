import { Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { readStacksExecutedGenerators } from '../lib/stacks';

export function executedDependantGenerator(
    tree: Tree,
    generatorName: string,
    projectName?: string,
) {
    let projectGenerator = false;

    const workspaceGenerator =
        readStacksExecutedGenerators(tree).workspace.includes(generatorName);

    if (projectName) {
        projectGenerator =
            readStacksExecutedGenerators(tree).project[projectName]?.includes(
                generatorName,
            );
    }

    const generatorExecuted = workspaceGenerator || projectGenerator;

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
