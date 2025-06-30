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
import { HttpClientGeneratorSchema } from './schema';

function snapshotFiles(tree: Tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('http-client generator', () => {
    let tree: Tree;
    const options: HttpClientGeneratorSchema = {
        name: 'test-client',
        directory: 'test-client',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the http-client', async () => {
        await generator(tree, {
            ...options,
            tags: 'test, client',
        });
        const config = readProjectConfiguration(tree, 'test-client');
        expect(config).toBeDefined();
        expect(config.tags).toEqual(['test', 'client']);

        snapshotFiles(tree, [
            joinPathFragments(config.root, 'project.json'),
            joinPathFragments(config.root, 'tsconfig.json'),
            joinPathFragments(config.root, 'tsconfig.lib.json'),
            joinPathFragments(config.root, 'tsconfig.spec.json'),
            joinPathFragments(config.root, '.eslintrc.json'),
            joinPathFragments(config.root, 'jest.config.ts'),
            joinPathFragments(config.root, 'src', 'index.ts'),
            joinPathFragments(config.root, 'src', 'index.test.ts'),
            joinPathFragments(config.root, 'README.md'),
            'jest.config.ts',
            'jest.preset.js',
            '.prettierignore',
            '.prettierrc',
        ]);
    });

    it('should generate the http-client with custom directory', async () => {
        await generator(tree, {
            ...options,
            directory: 'custom',
            tags: 'test, client',
        });

        const config = readProjectConfiguration(tree, 'test-client');

        expect(config).toBeDefined();
        expect(config.tags).toEqual(['test', 'client']);

        snapshotFiles(tree, [
            joinPathFragments(config.root, 'project.json'),
            joinPathFragments(config.root, 'tsconfig.json'),
            joinPathFragments(config.root, 'tsconfig.lib.json'),
            joinPathFragments(config.root, 'tsconfig.spec.json'),
            joinPathFragments(config.root, '.eslintrc.json'),
            joinPathFragments(config.root, 'jest.config.ts'),
            joinPathFragments(config.root, 'src', 'index.ts'),
            joinPathFragments(config.root, 'src', 'index.test.ts'),
            joinPathFragments(config.root, 'README.md'),
            'jest.config.ts',
            'jest.preset.js',
            '.prettierignore',
            '.prettierrc',
        ]);
    });

    it('should generate the http-client with custom import path', async () => {
        await generator(tree, {
            ...options,
            importPath: '@customimport/restclient',
        });

        const config = readProjectConfiguration(tree, 'test-client');

        expect(config).toBeDefined();

        snapshotFiles(tree, [
            joinPathFragments(config.root, 'project.json'),
            joinPathFragments(config.root, 'tsconfig.json'),
            joinPathFragments(config.root, 'tsconfig.lib.json'),
            joinPathFragments(config.root, 'tsconfig.spec.json'),
            joinPathFragments(config.root, '.eslintrc.json'),
            joinPathFragments(config.root, 'jest.config.ts'),
            joinPathFragments(config.root, 'src', 'index.ts'),
            joinPathFragments(config.root, 'src', 'index.test.ts'),
            joinPathFragments(config.root, 'README.md'),
            'jest.config.ts',
            'jest.preset.js',
            '.prettierignore',
            '.prettierrc',
        ]);

        const tsConfig = readJson(tree, `tsconfig.base.json`);
        expect(tsConfig.compilerOptions.paths).toHaveProperty(
            '@customimport/restclient',
        );
    });

    it('should generate the http-client with no formatting', async () => {
        await generator(tree, {
            ...options,
            skipFormat: true,
        });

        const config = readProjectConfiguration(tree, 'test-client');

        expect(config).toBeDefined();

        snapshotFiles(tree, [
            joinPathFragments(config.root, 'project.json'),
            joinPathFragments(config.root, 'tsconfig.json'),
            joinPathFragments(config.root, 'tsconfig.lib.json'),
            joinPathFragments(config.root, 'tsconfig.spec.json'),
            joinPathFragments(config.root, '.eslintrc.json'),
            joinPathFragments(config.root, 'jest.config.ts'),
            joinPathFragments(config.root, 'src', 'index.ts'),
            joinPathFragments(config.root, 'src', 'index.test.ts'),
            joinPathFragments(config.root, 'README.md'),
            'jest.config.ts',
            'jest.preset.js',
            '.prettierignore',
            '.prettierrc',
        ]);
    });

    it('should install axios as dependency', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['axios']),
        );
    });
});
