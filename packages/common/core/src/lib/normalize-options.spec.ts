import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { normalizeOptions } from './normalize-options';

describe('normalizeOptions', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should generate options based on name', () => {
        expect(
            normalizeOptions(appTree, {
                name: 'some-lib',
            }),
        ).toEqual({
            name: 'some-lib',
            projectName: 'some-lib',
            projectRoot: 'some-lib',
            projectDirectory: 'some-lib',
            parsedTags: [],
        });
    });

    it('should generate options based on name and directory', () => {
        expect(
            normalizeOptions(appTree, {
                name: 'some-lib',
                directory: 'subdir',
            }),
        ).toEqual({
            name: 'some-lib',
            directory: 'subdir',
            projectName: 'subdir-some-lib',
            projectRoot: 'subdir/some-lib',
            projectDirectory: 'subdir/some-lib',
            parsedTags: [],
        });
    });
});
