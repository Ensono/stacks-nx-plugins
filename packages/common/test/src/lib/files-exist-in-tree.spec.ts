import { createTree } from '@nx/devkit/testing';

import { checkFilesExistInTree } from './files-exist-in-tree';

describe('files exist', () => {
    const tree = createTree();

    beforeAll(() => {
        tree.write('file1', 'contents');
        tree.write('file3', 'contents');
        tree.write('file5', 'contents');
        tree.write('file7', 'contents');
        tree.write('file9', 'contents');
    });

    it('should throw no error if all files present', () => {
        expect(() =>
            checkFilesExistInTree(tree, 'file1', 'file3', 'file7', 'file9'),
        ).not.toThrow();
    });

    it('should throw an error if files are not present', () => {
        expect(() =>
            checkFilesExistInTree(tree, 'file1', 'file2', 'file3', 'file4'),
        ).toThrowErrorMatchingInlineSnapshot(`
          [Error: The following files are not present within the tree:
          file2
          file4]
        `);
    });
});
