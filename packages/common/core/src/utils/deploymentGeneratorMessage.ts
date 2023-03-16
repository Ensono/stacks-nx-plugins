import { logger, Tree } from '@nrwl/devkit';

import { readStacksConfig } from '../lib/stacks';

export function deploymentGeneratorMessage(tree: Tree, message: string) {
    const stacksConfig = readStacksConfig(tree);

    if (stacksConfig) {
        console.log('\n');
        logger.warn(
            `If you would like to install the relevant deployment configuration, run the following generator: ${message}`,
        );
        console.log('\n');
    }
}
