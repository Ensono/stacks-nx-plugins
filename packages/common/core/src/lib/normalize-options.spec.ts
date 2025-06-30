import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import path from 'path';

import { normalizeOptions } from '.';

describe('normalize', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    describe('normalizeOptions', () => {
        it('should generate options based on name', async () => {
            const data = await normalizeOptions(
                appTree,
                {
                    name: 'some-lib',
                    directory: 'libs/some-lib',
                },
                'library',
            );
            expect(data).toEqual({
                name: 'some-lib',
                importPath: '@proj/some-lib',
                directory: 'libs/some-lib',
                projectName: 'some-lib',
                projectRoot: 'libs/some-lib',
                parsedTags: [],
            });
        });
    });
});
