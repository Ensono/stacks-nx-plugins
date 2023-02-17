import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { copyFiles } from './copy-files';

describe('copyFiles', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should copy a single file', () => {
        appTree.write('single/src/file.txt', 'single file');

        copyFiles(appTree, 'single/src/file.txt', 'single/dest/file.txt');

        expect(() => appTree.exists('single/dest/file.txt')).not.toThrow();
        expect(appTree.read('single/dest/file.txt')?.toString()).toEqual(
            'single file',
        );
    });

    it('should copy multiple files', () => {
        appTree.write('multi/src/file1.txt', 'one');
        appTree.write('multi/src/file2.txt', 'two');
        appTree.write('multi/src/file3.txt', 'three');

        copyFiles(appTree, 'multi/src', 'multi/dest');

        expect(() => appTree.exists('multi/dest/file1.txt')).not.toThrow();
        expect(() => appTree.exists('multi/dest/file2.txt')).not.toThrow();
        expect(() => appTree.exists('multi/dest/file3.txt')).not.toThrow();

        expect(appTree.read('multi/dest/file1.txt')?.toString()).toEqual('one');
        expect(appTree.read('multi/dest/file2.txt')?.toString()).toEqual('two');
        expect(appTree.read('multi/dest/file3.txt')?.toString()).toEqual(
            'three',
        );
    });

    it('should copy folders recursively', () => {
        appTree.write('rec/src/file1.txt', 'one');
        appTree.write('rec/src/file2.txt', 'two');
        appTree.write('rec/src/dir1/file1.txt', 'one one');
        appTree.write('rec/src/dir1/subdir1/file1.txt', 'one one one');
        appTree.write('rec/src/dir1/subdir2/file1.txt', 'one two one');
        appTree.write('rec/src/dir1/subdir2/file2.txt', 'one two two');

        copyFiles(appTree, 'rec/src', 'rec/dest');

        expect(() => appTree.exists('rec/dest/file1.txt')).not.toThrow();
        expect(() => appTree.exists('rec/dest/file2.txt')).not.toThrow();
        expect(() => appTree.exists('rec/dest/dir1/file1.txt')).not.toThrow();
        expect(() =>
            appTree.exists('rec/dest/dir1/subdir1/file1.txt'),
        ).not.toThrow();
        expect(() =>
            appTree.exists('rec/dest/dir1/subdir2/file1.txt'),
        ).not.toThrow();
        expect(() =>
            appTree.exists('rec/dest/dir1/subdir2/file2.txt'),
        ).not.toThrow();
    });

    it('should overwrite existing file', () => {
        appTree.write('overwrite/src/subdir/file1.txt', 'source');
        appTree.write('overwrite/dest/subdir/file1.txt', 'dest');

        copyFiles(appTree, 'overwrite/src', 'overwrite/dest');

        expect(
            appTree.read('overwrite/dest/subdir/file1.txt')?.toString(),
        ).toEqual('source');
    });
});
