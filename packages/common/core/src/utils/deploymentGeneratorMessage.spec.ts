import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import chalk from 'chalk';
import { vi } from 'vitest';

import { deploymentGeneratorMessage } from './deploymentGeneratorMessage';

describe('addCustomTestConfig', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add custom test config', async () => {
        const logSpy = vi.spyOn(console, 'log');

        addStacksAttributes(appTree, '');

        deploymentGeneratorMessage(appTree, 'test message');

        expect(logSpy).toHaveBeenCalledWith(
            '\n',
            chalk.yellow(
                `If you would like to install the relevant deployment configuration, run the following generator: `,
            ),
            chalk.magenta(`test message`),
            '\n',
        );
    });
});
