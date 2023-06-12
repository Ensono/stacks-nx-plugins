import { createNextApp } from '@ensono-stacks/test';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';

import { nonMonorepo } from '.';

describe('nonMonorepo', () => {
    let tree: Tree;
    const project = 'testproject';

    it('should return true if no apps', () => {
        tree = createTreeWithEmptyWorkspace();

        expect(nonMonorepo(tree, './')).toBe(false);
    });

    describe('with apps', () => {
        beforeEach(async () => {
            tree = await createNextApp(project);
        });

        it('should return true if apps exists', () => {
            expect(nonMonorepo(tree, project)).toBe(false);
        });
    });
});
