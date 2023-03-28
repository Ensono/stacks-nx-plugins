import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator as nextGenerator } from '@nrwl/next/src/generators/application/application';

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
        });

        const project = readProjectConfiguration(appTree, 'test');

        const testConfig = {
            testObject: {
                key: 'value',
            },
        };

        addCustomTestConfig(appTree, project, 'test', testConfig);

        expect(
            project.targets?.['test'].configurations?.['testObject'],
        ).toEqual({
            key: 'value',
        });
    });
});
