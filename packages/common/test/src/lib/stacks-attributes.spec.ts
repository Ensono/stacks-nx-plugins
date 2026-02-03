import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { addStacksAttributes } from '.';

describe('stacks', () => {
    let tree: Tree;

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('addStacksAttributes', () => {
        it('should add stacks attributes to nx.json and return with the values', () => {
            const expectedStacksConfig = {
                business: {
                    company: 'Amido',
                    domain: 'stacks',
                    component: 'nx',
                },
                domain: {
                    internal: 'test.com',
                    external: 'test.dev',
                },
                cloud: {
                    region: 'euw',
                    platform: 'azure',
                },
                vcs: {
                    type: 'github',
                    url: 'remote.git',
                },
            };
            const expectedStacksExecutedGenerators = {
                project: {
                    'test-project': [],
                },
                workspace: [],
            };

            const result = addStacksAttributes(tree, 'test-project');

            const nxJson = JSON.parse(tree.read('nx.json', 'utf8') as string);
            expect(nxJson.stacks).toBeTruthy();
            expect(nxJson.stacks.config).toMatchObject(expectedStacksConfig);
            expect(nxJson.stacks.executedGenerators).toMatchObject(
                expectedStacksExecutedGenerators,
            );

            expect(result.stacksConfig).toMatchObject(expectedStacksConfig);
            expect(result.stacksExecutedGenerators).toMatchObject(
                expectedStacksExecutedGenerators,
            );
        });
    });
});
