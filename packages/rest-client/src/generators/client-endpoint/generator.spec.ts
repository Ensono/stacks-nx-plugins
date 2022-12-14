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

    it('should generate the endpiont', async () => {
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
});
