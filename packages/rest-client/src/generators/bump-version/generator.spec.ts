import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { BumpVersionGeneratorSchema } from './schema';

describe('bump-version generator', () => {
    let tree: Tree;
    const options: BumpVersionGeneratorSchema = {
        directory: 'endpoints',
        name: 'test',
    };

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
        tree.write('endpoints/test/v1/src/index.ts', 'test');
    });

    it('should throw a TypeError if version is not a number', async () => {
        await expect(
            generator(tree, {
                ...options,
                endpointVersion: Number('test'),
            }),
        ).rejects.toThrowError('The endpoint version needs to be a number.');
    });

    it("should throw an error if the endpoint doesn't exist", async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                name: 'nonexistent',
            }),
        ).rejects.toThrowError(
            "Could not find previous version of the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    });

    it('should throw an error if the new version is not higher', async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                endpointVersion: 1,
            }),
        ).rejects.toThrowError(
            'Cannot decrease a version. Please use --endpointVersion higher than 1',
        );
    });

    it('should generate the new version of the endpoint', async () => {
        tree.write('fixtures/endpoints/test/v1/src/index.ts', 'test');
        await generator(tree, {
            ...options,
            directory: 'fixtures/endpoints',
        });

        expect(() =>
            tree.exists('fixtures/endpoints/test/v1/src/index.ts'),
        ).not.toThrow();
        expect(() =>
            tree.exists('fixtures/endpoints/test/v2/src/index.ts'),
        ).not.toThrow();
    });

    it('should determine new version based on existing versions if --endpointVersion is omitted', async () => {
        // intentionally in random order
        tree.write('fixtures/endpoints/test/v1/index.ts', 'test');
        tree.write('fixtures/endpoints/test/v6/index.ts', 'test');
        tree.write('fixtures/endpoints/test/v5/index.ts', 'test');
        tree.write('fixtures/endpoints/test/v3/index.ts', 'test');

        await generator(tree, {
            ...options,
            directory: 'fixtures/endpoints',
        });

        expect(() =>
            tree.exists('fixtures/endpoints/test/v7/src/index.ts'),
        ).not.toThrow();
    });

    it('should respect --endpointVersion', async () => {
        tree.write('fixtures/endpoints/test/v1/src/index.ts', 'test');
        await generator(tree, {
            ...options,
            directory: 'fixtures/endpoints',
            endpointVersion: 3,
        });

        expect(() =>
            tree.exists('fixtures/endpoints/test/v1/src/index.ts'),
        ).not.toThrow();
        expect(() =>
            tree.exists('fixtures/endpoints/test/v3/src/index.ts'),
        ).not.toThrow();
    });

    it('should update types and names in code of the new version', async () => {
        // TODO
    });
});
