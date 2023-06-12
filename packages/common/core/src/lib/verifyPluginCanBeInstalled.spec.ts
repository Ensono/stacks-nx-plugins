import { createNextApp } from '@ensono-stacks/test';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';

import { verifyPluginCanBeInstalled } from '.';

describe('verifyPluginCanBeInstalled', () => {
    let tree: Tree;
    const project = 'testproject';

    it('should return true if no apps', () => {
        tree = createTreeWithEmptyWorkspace();

        expect(verifyPluginCanBeInstalled(tree, './')).toBe(false);
    });

    describe('with apps', () => {
        beforeEach(async () => {
            tree = await createNextApp(project);
        });

        it('should return true if apps exists', () => {
            expect(verifyPluginCanBeInstalled(tree, project)).toBe(false);
        });
    });
});
