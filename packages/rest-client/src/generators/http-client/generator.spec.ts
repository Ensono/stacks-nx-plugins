import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { HttpClientGeneratorSchema } from './schema';

describe('http-client generator', () => {
    let tree: Tree;
    const options: HttpClientGeneratorSchema = { name: 'testClient' };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the http-client', async () => {
        await generator(tree, {
            ...options,
            directory: 'custom',
            tags: 'test, client',
        });

        const config = readProjectConfiguration(tree, 'custom-test-client');

        expect(config).toBeDefined();
        expect(config.tags).toEqual(['test', 'client']);
    });

    it('should install axios as dependency', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['axios']),
        );
    });
});
