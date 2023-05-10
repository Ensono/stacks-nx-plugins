import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { OpenapiClientGeneratorSchema } from './schema';

describe('openapi-client generator', () => {
    let tree: Tree;
    const options: OpenapiClientGeneratorSchema = { name: 'testClient' };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        await generator(tree, options);
        const config = readProjectConfiguration(tree, 'test-client');
        expect(config).toBeDefined();
    });
});
