import { Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { readStacksConfig } from '../lib/stacks';

export function deploymentGeneratorMessage(tree: Tree, message: string) {
    const stacksConfig = readStacksConfig(tree);

    if (stacksConfig) {
        console.log(
            '\n',
            chalk.yellow`If you would like to install the relevant deployment configuration, run the following generator: `,
            chalk.magenta`${message}`,
            '\n',
        );
    }
}
