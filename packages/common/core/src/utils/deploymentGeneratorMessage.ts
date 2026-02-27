import { Tree } from '@nx/devkit';
import chalk from 'chalk';

import { readStacksConfig } from '../lib/stacks';

export function deploymentGeneratorMessage(tree: Tree, message: string) {
    try {
        const stacksConfig = readStacksConfig(tree);

        if (stacksConfig) {
            console.log(
                '\n',
                chalk.yellow(
                    `If you would like to install the relevant deployment configuration, run the following generator: `,
                ),
                chalk.magenta(`${message}`),
                '\n',
            );
        }
    } catch {
        // We don't show the message if stacks config is missing or incomplete
    }
}
