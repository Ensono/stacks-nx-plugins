import { tsMorphTree } from '@ensono-stacks/core';
import { checkFilesExistInTree } from '@ensono-stacks/test';
import {
    Tree,
    readProjectConfiguration,
    readJson,
    joinPathFragments,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { OpenapiClientGeneratorSchema } from './schema';

function snapshotFiles(tree: Tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrow();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('openapi-client generator', () => {
    let tree: Tree;
    const options: OpenapiClientGeneratorSchema = {
        name: 'test-client',
        schema: 'test.yaml',
        zod: false,
        directory: 'test-client',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        tree.write('test.yaml', '');
    });

    it('should run successfully', async () => {
        await generator(tree, options);
        const config = readProjectConfiguration(tree, 'test-client');
        expect(config).toBeDefined();

        snapshotFiles(tree, [
            joinPathFragments('test-client', 'project.json'),
            joinPathFragments('test-client', 'tsconfig.json'),
            joinPathFragments('test-client', 'tsconfig.lib.json'),
            joinPathFragments('test-client', 'tsconfig.spec.json'),
            joinPathFragments('test-client', '.eslintrc.json'),
            joinPathFragments('test-client', 'package.json'),
            joinPathFragments('test-client', 'jest.config.cts'),
            joinPathFragments('test-client/src', 'index.ts'),
            joinPathFragments('test-client', 'README.md'),
        ]);
    });

    it('should throw an error if schema not found', async () => {
        tree.delete('test.yaml');
        await expect(
            generator(tree, {
                ...options,
                schema: '',
            }),
        ).rejects.toThrow(
            'Provided schema does not exist in the workspace. Please check and try again',
        );
    });

    it('should throw an error if directory specified', async () => {
        tree.delete('test.yaml');
        tree.write('openapi/test.yaml', '');
        await expect(
            generator(tree, {
                ...options,
                schema: './openapi',
            }),
        ).rejects.toThrow(
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

        snapshotFiles(tree, [
            joinPathFragments('test-client', 'orval.config.js'),
        ]);

        const orvalConfig = tree.read('test-client/orval.config.js', 'utf8');

        expect(orvalConfig).toContain(`target: './src/test-client.ts',`);
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

            snapshotFiles(tree, [
                joinPathFragments('test-client', 'orval.zod.config.js'),
            ]);

            const orvalConfig = tree.read(
                'test-client/orval.zod.config.js',
                'utf8',
            );

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
