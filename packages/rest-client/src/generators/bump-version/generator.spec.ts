import { Tree, generateFiles } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { BumpVersionGeneratorSchema } from './schema';

jest.mock('@nrwl/devkit', () => ({
    __esModule: true,
    ...jest.requireActual('@nrwl/devkit'),
    generateFiles: jest.fn(),
}));

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
            endpointPath: 'fixtures/endpoints',
        });

        expect(generateFiles).toHaveBeenCalledWith(
            tree,
            'fixtures/endpoints/test/V1',
            'fixtures/endpoints/test/V2',
            {
                endpoint: 'test',
                endpointPath: 'fixtures/endpoints',
                endpointVersion: 2,
                template: '',
            },
        );
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
