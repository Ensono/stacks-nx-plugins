import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { ClientEndpointGeneratorSchema } from './schema';

describe('client-endpoint generator', () => {
    let tree: Tree;
    const options: ClientEndpointGeneratorSchema = {
        name: 'test-endpoint',
        httpClient: '@ensono-stacks/http-client',
        envVar: 'API_URL',
        methods: ['get', 'post', 'patch', 'put', 'delete', 'head', 'options'],
        endpointVersion: 1,
        folderPath: 'api',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the endpoint', async () => {
        await generator(tree, {
            ...options,
            tags: 'testEndpoint',
        });

        expect(tree.exists('api/test-endpoint/v1/src/index.ts')).toBeTruthy();
        expect(
            tree.exists('api/test-endpoint/v1/src/index.test.ts'),
        ).toBeTruthy();
        expect(
            tree.exists('api/test-endpoint/v1/src/index.types.ts'),
        ).toBeTruthy();

        const fileContent = tree.read(
            `api/test-endpoint/v1/src/index.ts`,
            'utf8',
        );
        expect(fileContent).toMatch(
            /import httpClient, {\n *RequestConfig,\n *Response,\n *} from '@ensono-stacks\/http-client'/g,
        );
    });

    it("should generate an .env.local file to the root if it doesn't exist", async () => {
        await generator(tree, {
            ...options,
            tags: 'testEndpoint',
        });

        expect(tree.exists('.env.local')).toBeTruthy();
    });

    it('should throw an error if method is not selected', async () => {
        await expect(
            generator(tree, {
                ...options,
                methods: [],
                tags: 'testEndpoint',
            }),
        ).rejects.toThrow("You haven't selected any method to generate.");
    });

    it('should throw a TypeError if version is not a number', async () => {
        await expect(
            generator(tree, {
                ...options,
                endpointVersion: Number('test'),
                tags: 'testEndpoint',
            }),
        ).rejects.toThrow('The endpoint version needs to be a number.');
    });
});
