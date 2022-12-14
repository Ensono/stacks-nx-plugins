import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { BumpVersionGeneratorSchema } from './schema';

describe('bump-version generator', () => {
    let tree: Tree;
    const options: BumpVersionGeneratorSchema = {
        endpointPath: 'endpoints',
        endpoint: 'test',
        endpointVersion: 2,
    };

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
        tree.write('endpoints/test/V1/index.ts', 'test');
    });

    it('should generate the new version of the endpoint', async () => {
        tree.write('fixtures/endpoints/test/V1/index.ts', 'test');
        await generator(tree, {
            ...options,
            endpointPath: './fixtures/endpoints',
        });

        expect(
            tree.exists('./fixtures/endpoints/test/V2/index.ts'),
        ).toBeTruthy();
    });

    it("should throw an error if the endpoint doesn't exist", async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                endpoint: 'nonexistent',
            }),
        ).rejects.toThrowError('No version could be found for endpoint');
    });

    it('should throw an error if the new version is not higher', async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                endpointVersion: 1,
            }),
        ).rejects.toThrowError('Cannot bump to previous or current version');
    });
});
