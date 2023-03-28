import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { addIgnoreEntry } from './ignoreEntry';

describe('ignoreEntry', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, '');
    });

    describe('addIgnoreEntry', () => {
        it('should not include new entry', async () => {
            appTree.write('.gitignore', '');

            const ignoreFile = appTree.read('.gitignore', 'utf-8');

            expect(ignoreFile).not.toContain('# TestHeading');
            expect(ignoreFile).not.toContain('line1');
        });

        it('should add new entry', async () => {
            appTree.write('.gitignore', '');

            addIgnoreEntry(appTree, '.gitignore', 'TestHeading', ['line1']);

            const ignoreFile = appTree.read('.gitignore', 'utf-8');

            expect(ignoreFile).toContain('# TestHeading');
            expect(ignoreFile).toContain('line1');
        });

        it('should not duplicate heading', async () => {
            appTree.write('.gitignore', '');

            addIgnoreEntry(appTree, '.gitignore', 'TestHeading', ['line1']);
            addIgnoreEntry(appTree, '.gitignore', 'TestHeading', ['line2']);

            const ignoreFile = appTree.read('.gitignore', 'utf-8');

            expect(ignoreFile).toBe(`\n
# TestHeading
line1
line2`);
        });
    });
});
