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
        it('should generate options based on name', () => {
            expect(
                normalizeOptions(appTree, {
                    name: 'some-lib',
                }),
            ).toEqual({
                name: 'some-lib',
                directory: null,
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
                projectRoot: path.join('subdir', 'some-lib'),
                projectDirectory: path.join('subdir', 'some-lib'),
                parsedTags: [],
            });
        });

        it.each([
            ['libs', { directory: null, name: 'some-lib', root: 'some-lib' }],
            ['apps', { directory: null, name: 'some-lib', root: 'some-lib' }],
            [
                'packages',
                { directory: null, name: 'some-lib', root: 'some-lib' },
            ],
            ['', { directory: null, name: 'some-lib', root: 'some-lib' }],
            [
                'subdir',
                {
                    directory: 'subdir',
                    name: 'subdir-some-lib',
                    root: path.join('subdir', 'some-lib'),
                },
            ],
        ])(
            'should remove special names from directory to follow nx approach',
            (directory, expected) => {
                expect(
                    normalizeOptions(appTree, {
                        name: 'some-lib',
                        directory,
                    }),
                ).toEqual({
                    name: 'some-lib',
                    directory: expected.directory,
                    projectName: expected.name,
                    projectRoot: expected.root,
                    projectDirectory: expected.root,
                    parsedTags: [],
                });
            },
        );
    });
});
