import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator as nextGenerator } from '@nx/next/src/generators/application/application';

import { addCustomTestConfig } from './addCustomTestConfig';

describe('addCustomTestConfig', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should add custom test config', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
            directory: 'test',
        });

        const project = readProjectConfiguration(appTree, 'test');

        const testConfig = {
            testObject: {
                key: 'value',
            },
        };

        addCustomTestConfig(appTree, project, testConfig);

        expect(
            project.targets?.['test'].configurations?.['testObject'],
        ).toEqual({
            key: 'value',
        });
    });
});
