import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import chalk from 'chalk';

import { thirdPartyDependencyWarning } from './thirdPartyDependencyWarning';

describe('thirdPartyDependencyWarning', () => {
    let appTree: Tree;
    const projectName = 'testProject';

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, projectName);
    });

    it('should add entry on execution', async () => {
        const logSpy = jest.spyOn(global.console, 'warn');

        thirdPartyDependencyWarning(['dep1', 'dep2', 'dep3']);

        expect(logSpy).toBeCalledWith(
            chalk.yellow`This generator depends on third party generators listed below:\ndep1\ndep2\ndep3`,
        );
    });
});
