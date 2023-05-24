import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { OpenapiClientGeneratorSchema } from './schema';

describe('openapi-client generator', () => {
    let tree: Tree;
    const options: OpenapiClientGeneratorSchema = {
        name: 'testClient',
        schema: 'test.yaml',
        zod: false,
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        tree.write('test.yaml', '');
    });

    it('should run successfully', async () => {
        await generator(tree, options);
        const config = readProjectConfiguration(tree, 'test-client');
        expect(config).toBeDefined();
    });

    it('should throw an error if schema not found', async () => {
        tree.delete('test.yaml');
        await expect(
            generator(tree, {
                ...options,
                schema: '',
            }),
        ).rejects.toThrowError(
            'Provided schema does not exist in the workspace. Please check and try again',
        );
    });

    it('should delete default src lib', async () => {
        await generator(tree, options);

        const sourceLibrary = tree.exists('src/lib');

        expect(sourceLibrary).toBeFalsy();
    });

    it('should copy schema into generated lib', async () => {
        await generator(tree, options);

        const orvalConfig = tree.exists('test-client/test.yaml');

        expect(orvalConfig).toBeTruthy();
    });

    it('should generate orval config', async () => {
        expect(tree.exists('orval.config.js')).toBeFalsy();

        await generator(tree, options);

        const orvalConfigExists = tree.exists('test-client/orval.config.js');
        const orvalConfig = tree.read('test-client/orval.config.js', 'utf-8');

        expect(orvalConfigExists).toBeTruthy();

        expect(orvalConfig).toContain(`target: './src/testClient.ts',`);
        expect(orvalConfig).toContain(`target: './test.yaml',`);
    });

    it('should install orval as dependency', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(Object.keys(packageJson.devDependencies)).toEqual(
            expect.arrayContaining(['orval']),
        );
    });

    describe('--zod', () => {
        const zodOptions = {
            ...options,
            zod: true,
        };

        it('should generate orval.zod config', async () => {
            expect(tree.exists('orval.zod.config.js')).toBeFalsy();

            await generator(tree, zodOptions);

            const orvalConfigExists = tree.exists(
                'test-client/orval.zod.config.js',
            );
            const orvalConfig = tree.read(
                'test-client/orval.zod.config.js',
                'utf-8',
            );

            expect(orvalConfigExists).toBeTruthy();

            expect(orvalConfig).toContain(`client: 'zod',`);
            expect(orvalConfig).toContain(`target: './test.yaml',`);
        });

        it('should install zod as dependency', async () => {
            await generator(tree, zodOptions);

            const packageJson = readJson(tree, 'package.json');
            expect(Object.keys(packageJson.dependencies)).toEqual(
                expect.arrayContaining(['zod']),
            );
        });
    });
});
