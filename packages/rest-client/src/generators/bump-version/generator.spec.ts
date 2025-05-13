import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { libraryGenerator } from '@nx/js';
import fs from 'fs';
import path from 'path';

import generator from './generator';
import { BumpVersionGeneratorSchema } from './schema';
import clientEndpointGenerator from '../client-endpoint/generator';
import httpClientGenerator from '../http-client/generator';

describe('bump-version generator', () => {
    let tree: Tree;
    const options: BumpVersionGeneratorSchema = {
        name: 'api-v1',
    };

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
        await httpClientGenerator(tree, {
            name: 'http',
            importPath: '@proj/http',
            directory: 'client',
        });
        await clientEndpointGenerator(tree, {
            name: 'api',
            httpClient: '@proj/http',
            methods: ['get'],
            envVar: 'API_URL',
            endpointVersion: 1,
            directory: 'api',
        });
    });

    it('should throw a TypeError if version is not a number', async () => {
        await expect(
            generator(tree, {
                ...options,
                endpointVersion: Number('test'),
            }),
        ).rejects.toThrow('The endpoint version needs to be a number.');
    });

    it("should throw an error if the endpoint doesn't exist", async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                name: 'nonexistent',
            }),
        ).rejects.toThrow(
            "Could not find target project of the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    });

    it('should throw an error if the target project is not an endpoint', async () => {
        await libraryGenerator(tree, {
            name: 'non-endpoint',
            bundler: 'none',
            unitTestRunner: 'none',
            directory: 'non-endpoint',
        });
        await expect(() =>
            generator(tree, {
                ...options,
                name: 'non-endpoint',
            }),
        ).rejects.toThrow(
            'No version is present for the target project. Please ensure it was generated with @ensono-stacks/rest-client:client-endpoint',
        );
    });

    it('should throw an error if the new version is not higher', async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                endpointVersion: 1,
            }),
        ).rejects.toThrow(
            'Cannot decrease a version. Please use --endpointVersion higher than 1',
        );
    });

    it('should generate the new version of the endpoint', async () => {
        await generator(tree, {
            ...options,
            endpointVersion: 4,
        });
        expect(() => tree.exists(`api/v1/src/index.ts`)).not.toThrow();
        expect(() => tree.exists(`api/v4/src/index.ts`)).not.toThrow();
    });

    it('should determine new version based on existing versions if --endpointVersion is omitted', async () => {
        await generator(tree, {
            ...options,
        });

        expect(() => tree.exists(`api/v1/src/index.ts`)).not.toThrow();
        expect(() => tree.exists(`api/v2/src/index.ts`)).not.toThrow();
    });

    it('should update any version numbers in the code', async () => {
        const fixturesPath = path.resolve(
            __dirname,
            path.join('test', 'fixtures'),
        );

        tree.write(
            `api/v1/test/src/index.ts`,
            fs.readFileSync(path.join(fixturesPath, 'index.ts.fixture')),
        );
        tree.write(
            `api/v1/test/src/index.test.ts`,
            fs.readFileSync(path.join(fixturesPath, 'index.test.ts.fixture')),
        );
        tree.write(
            `api/v1/test/src/index.types.ts`,
            fs.readFileSync(path.join(fixturesPath, 'index.types.ts.fixture')),
        );

        await generator(tree, {
            ...options,
            endpointVersion: 3,
        });

        const indexTs = tree.read(`api/v3/test/src/index.ts`)?.toString();
        const indexTestTs = tree
            .read(`api/v3/test/src/index.test.ts`)
            ?.toString();
        const indexTypesTs = tree
            .read(`api/v3/test/src/index.types.ts`)
            ?.toString();

        expect(indexTs).not.toContain(
            "import { TestV1, TestV1Data } from './index.types';",
        );
        expect(indexTs).toContain(
            "import { TestV3, TestV3Data } from './index.types';",
        );
        expect(indexTs).not.toContain(
            // eslint-disable-next-line no-template-curly-in-string
            'const API_ENDPOINT = `${process.env.API_URL}/test/v1`;',
        );
        expect(indexTs).toContain(
            // eslint-disable-next-line no-template-curly-in-string
            'const API_ENDPOINT = `${process.env.API_URL}/test/v3`;',
        );

        expect(indexTestTs).not.toContain(
            "describe('TestV1 endpoint', () => {",
        );
        expect(indexTestTs).toContain("describe('TestV3 endpoint', () => {");

        expect(indexTypesTs).not.toContain('export interface TestV1 {}');
        expect(indexTypesTs).not.toContain('export interface TestV1Data {}');
        expect(indexTypesTs).toContain('export interface TestV3 {}');
        expect(indexTypesTs).toContain('export interface TestV3Data {}');

        expect(indexTs).toMatchSnapshot();
        expect(indexTestTs).toMatchSnapshot();
        expect(indexTypesTs).toMatchSnapshot();
    });
});
