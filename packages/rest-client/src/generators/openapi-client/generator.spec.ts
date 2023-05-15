import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { OpenapiClientGeneratorSchema } from './schema';

describe('openapi-client generator', () => {
    let tree: Tree;
    const options: OpenapiClientGeneratorSchema = {
        name: 'testClient',
        schema: 'test.yaml',
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

        // eslint-disable-next-line unicorn/prevent-abbreviations
        const srcLib = tree.exists('testClient/src/lib');

        expect(srcLib).toBeFalsy();
    });

    it('should copy schema into generated lib', async () => {
        await generator(tree, options);

        const orvalConfig = tree.exists('testClient/test.yaml');

        expect(orvalConfig).toBeTruthy();
    });

    it('should generate orval config', async () => {
        expect(tree.exists('testClient/orval.config.js')).toBeFalsy();

        await generator(tree, options);

        const orvalConfigExists = tree.exists('testClient/orval.config.js');
        const orvalConfig = tree.read('testClient/orval.config.js', 'utf-8');

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
});
