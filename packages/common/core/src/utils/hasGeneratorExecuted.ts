import { readJson, Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { tagExecutedGenerator } from './tagExecutedGenerator';

export function hasGeneratorExecuted(
    tree: Tree,
    projectName: string,
    generatorName: string,
) {
    const nxJson = readJson(tree, 'nx.json');
    let generatorExecuted = false;

    if (!nxJson?.stacks?.generatorsExecuted?.[generatorName]) {
        tagExecutedGenerator(tree, generatorName);
    } else {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the project`,
            chalk.magenta`${projectName}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
        generatorExecuted = true;
    }

    return generatorExecuted;
}
