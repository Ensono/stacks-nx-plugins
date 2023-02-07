import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { ClientEndpointGeneratorSchema } from './schema';

describe('client-endpoint generator', () => {
    let tree: Tree;
    const options: ClientEndpointGeneratorSchema = {
        name: 'testEndpoint',
        httpClient: '@ensono-stacks/http-client',
        envVar: 'API_URL',
        methods: ['get, post'],
        endpointVersion: 1,
        directory: 'endpoints',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the endpoint', async () => {
        await generator(tree, {
            ...options,
            tags: 'testEndpoint',
        });

        expect(tree.exists('endpoints/testEndpoint/V1/index.ts')).toBeTruthy();
        expect(
            tree.exists('endpoints/testEndpoint/V1/index.test.ts'),
        ).toBeTruthy();
        expect(
            tree.exists('endpoints/testEndpoint/V1/index.types.ts'),
        ).toBeTruthy();
    });

    it("should generate an .env file to the root if it doesn't exist", async () => {
        await generator(tree, {
            ...options,
            tags: 'testEndpoint',
        });

        expect(tree.exists('.env')).toBeTruthy();
    });

    it('should throw an error if method is not selected', async () => {
        await expect(
            generator(tree, {
                ...options,
                methods: [],
                tags: 'testEndpoint',
            }),
        ).rejects.toThrowError("You haven't selected any method to generate.");
    });

    it('should throw a TypeError if version is not a nunber', async () => {
        await expect(
            generator(tree, {
                ...options,
                endpointVersion: Number('test'),
                tags: 'testEndpoint',
            }),
        ).rejects.toThrowError('The endpoint version needs to be a number.');
    });
});
