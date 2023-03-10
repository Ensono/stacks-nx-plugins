import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import fs from 'fs';
import path from 'path';

import generator from './generator';
import { BumpVersionGeneratorSchema } from './schema';

describe('bump-version generator', () => {
    let tree: Tree;
    const options: BumpVersionGeneratorSchema = {
        name: 'test',
    };

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
        tree.write('endpoints/test/v1/src/index.ts', 'test');
        tree.write(
            'endpoints/test/v1/project.json',
            `{
                "name": "test"
            }`,
        );
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
        });

        expect(() =>
            tree.exists('fixtures/endpoints/test/v7/src/index.ts'),
        ).not.toThrow();
    });

    it('should respect --endpointVersion', async () => {
        tree.write('fixtures/endpoints/test/v1/src/index.ts', 'test');
        await generator(tree, {
            ...options,
            endpointVersion: 3,
        });

        expect(() =>
            tree.exists('fixtures/endpoints/test/v1/src/index.ts'),
        ).not.toThrow();
        expect(() =>
            tree.exists('fixtures/endpoints/test/v3/src/index.ts'),
        ).not.toThrow();
    });

    it('should update any version numbers in the code', async () => {
        const fixturesPath = path.resolve(
            __dirname,
            path.join('test', 'fixtures'),
        );

        tree.write(
            'endpoints/test/v1/src/index.ts',
            fs.readFileSync(path.join(fixturesPath, 'index.ts.fixture')),
        );
        tree.write(
            'endpoints/test/v1/src/index.test.ts',
            fs.readFileSync(path.join(fixturesPath, 'index.test.ts.fixture')),
        );
        tree.write(
            'endpoints/test/v1/src/index.types.ts',
            fs.readFileSync(path.join(fixturesPath, 'index.types.ts.fixture')),
        );

        await generator(tree, {
            ...options,
            endpointVersion: 3,
        });

        const indexTs = tree.read('endpoints/test/v3/src/index.ts')?.toString();
        const indexTestTs = tree
            .read('endpoints/test/v3/src/index.test.ts')
            ?.toString();
        const indexTypesTs = tree
            .read('endpoints/test/v3/src/index.types.ts')
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
