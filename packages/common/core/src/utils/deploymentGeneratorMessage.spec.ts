import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import chalk from 'chalk';

import { deploymentGeneratorMessage } from './deploymentGeneratorMessage';

describe('addCustomTestConfig', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add custom test config', async () => {
        const logSpy = jest.spyOn(global.console, 'log');

        addStacksAttributes(appTree, '');

        deploymentGeneratorMessage(appTree, 'test message');

        expect(logSpy).toBeCalledWith(
            '\n',
            chalk.yellow`If you would like to install the relevant deployment configuration, run the following generator: `,
            chalk.magenta`test message`,
            '\n',
        );
    });
});
