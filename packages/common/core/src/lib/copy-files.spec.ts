import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { copyFiles } from '.';

describe('files', () => {
    let tree: Tree;

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('copyFiles', () => {
        it('should copy a single file', () => {
            tree.write('single/src/file.txt', 'single file');

            copyFiles(tree, 'single/src/file.txt', 'single/dest/file.txt');

            expect(() => tree.exists('single/dest/file.txt')).not.toThrow();
            expect(tree.read('single/dest/file.txt')?.toString()).toEqual(
                'single file',
            );
        });

        it('should copy multiple files', () => {
            tree.write('multi/src/file1.txt', 'one');
            tree.write('multi/src/file2.txt', 'two');
            tree.write('multi/src/file3.txt', 'three');

            copyFiles(tree, 'multi/src', 'multi/dest');

            expect(() => tree.exists('multi/dest/file1.txt')).not.toThrow();
            expect(() => tree.exists('multi/dest/file2.txt')).not.toThrow();
            expect(() => tree.exists('multi/dest/file3.txt')).not.toThrow();

            expect(tree.read('multi/dest/file1.txt')?.toString()).toEqual(
                'one',
            );
            expect(tree.read('multi/dest/file2.txt')?.toString()).toEqual(
                'two',
            );
            expect(tree.read('multi/dest/file3.txt')?.toString()).toEqual(
                'three',
            );
        });

        it('should copy folders recursively', () => {
            tree.write('rec/src/file1.txt', 'one');
            tree.write('rec/src/file2.txt', 'two');
            tree.write('rec/src/dir1/file1.txt', 'one one');
            tree.write('rec/src/dir1/subdir1/file1.txt', 'one one one');
            tree.write('rec/src/dir1/subdir2/file1.txt', 'one two one');
            tree.write('rec/src/dir1/subdir2/file2.txt', 'one two two');

            copyFiles(tree, 'rec/src', 'rec/dest');

            expect(() => tree.exists('rec/dest/file1.txt')).not.toThrow();
            expect(() => tree.exists('rec/dest/file2.txt')).not.toThrow();
            expect(() => tree.exists('rec/dest/dir1/file1.txt')).not.toThrow();
            expect(() =>
                tree.exists('rec/dest/dir1/subdir1/file1.txt'),
            ).not.toThrow();
            expect(() =>
                tree.exists('rec/dest/dir1/subdir2/file1.txt'),
            ).not.toThrow();
            expect(() =>
                tree.exists('rec/dest/dir1/subdir2/file2.txt'),
            ).not.toThrow();
        });

        it('should overwrite existing file', () => {
            tree.write('overwrite/src/subdir/file1.txt', 'source');
            tree.write('overwrite/dest/subdir/file1.txt', 'dest');

            copyFiles(tree, 'overwrite/src', 'overwrite/dest');

            expect(
                tree.read('overwrite/dest/subdir/file1.txt')?.toString(),
            ).toEqual('source');
        });
    });
});
