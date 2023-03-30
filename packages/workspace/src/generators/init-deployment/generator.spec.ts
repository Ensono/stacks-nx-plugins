import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';

describe('init-deployment generator', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        addStacksAttributes(tree, '');
    });

    it('should generate with a taskctl pipeline', async () => {
        await generator(tree, {
            pipelineRunner: 'taskctl',
        });

        expect(tree.exists('build/taskctl')).toBeTruthy();
        expect(tree.exists('build/azDevOps')).toBeTruthy();
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(tree, {
                pipelineRunner: 'taskctl',
            });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(tree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.workspace.includes(
                    'WorkspaceDeployment',
                ),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(tree, {
                pipelineRunner: 'taskctl',
            });
            expect(gen).toBe(false);
        });
    });
});
