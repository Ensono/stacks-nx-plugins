import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { formatFiles } from './formatFiles';

describe('formatFiles', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, '');
    });

    it('should format file as expected', async () => {
        appTree.write('test/testFormat.js', `foo ( ); const test = "yoyo"`);

        await formatFiles(appTree);

        const formattedFile = appTree.read('test/testFormat.js', 'utf8');

        // Prettier formats the file with single quotes per project config
        expect(formattedFile).toBe(`foo();\nconst test = 'yoyo';\n`);
    });
});
