import { tsMorphTree } from '@ensono-stacks/core';
import { checkFilesExistInTree } from '@ensono-stacks/test';
import { Tree, joinPathFragments } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { ClientEndpointGeneratorSchema } from './schema';

function snapshotFiles(tree: Tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('client-endpoint generator', () => {
    let tree: Tree;
    const options: ClientEndpointGeneratorSchema = {
        name: 'testEndpoint',
        httpClient: '@ensono-stacks/http-client',
        envVar: 'API_URL',
        methods: ['get', 'post', 'patch', 'put', 'delete', 'head', 'options'],
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

        snapshotFiles(tree, [
            joinPathFragments('endpoints/test-endpoint/v1', 'project.json'),
            joinPathFragments('endpoints/test-endpoint/v1', 'tsconfig.json'),
            joinPathFragments(
                'endpoints/test-endpoint/v1',
                'tsconfig.lib.json',
            ),
            joinPathFragments(
                'endpoints/test-endpoint/v1',
                'tsconfig.spec.json',
            ),
            joinPathFragments('endpoints/test-endpoint/v1', '.eslintrc.json'),
            joinPathFragments('endpoints/test-endpoint/v1', 'package.json'),
            joinPathFragments('endpoints/test-endpoint/v1', 'jest.config.ts'),
            joinPathFragments('endpoints/test-endpoint/v1/src', 'index.ts'),
            joinPathFragments(
                'endpoints/test-endpoint/v1/src',
                'index.test.ts',
            ),
            joinPathFragments('endpoints/test-endpoint/v1', 'README.md'),
        ]);

        const fileContent = tree.read(
            `endpoints/test-endpoint/v1/src/index.ts`,
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
        ).rejects.toThrowError("You haven't selected any method to generate.");
    });

    it('should throw a TypeError if version is not a number', async () => {
        await expect(
            generator(tree, {
                ...options,
                endpointVersion: Number('test'),
                tags: 'testEndpoint',
            }),
        ).rejects.toThrowError('The endpoint version needs to be a number.');
    });
});
