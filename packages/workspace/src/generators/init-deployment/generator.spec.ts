import { Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';

describe('init-deployment generator', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate with a taskctl pipeline', async () => {
        updateJson(tree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                config: {
                    business: {
                        company: 'Ensono',
                        domain: 'Stacks',
                        component: 'Test',
                    },
                    cloud: { platform: 'azure', region: 'euw' },
                    domain: { external: 'ensono.com' },
                    pipeline: 'azdo',
                    vcs: {
                        type: 'github',
                    },
                },
            },
        }));
        await generator(tree, {
            pipelineRunner: 'taskctl',
        });

        expect(tree.exists('build/taskctl')).toBeTruthy();
        expect(tree.exists('build/azDevOps')).toBeTruthy();
    });
});
