import { Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { initGenerator } from './generator';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
    let tree: Tree;
    const options: InitGeneratorSchema = {
        name: 'test',
        consumerName: 'consumer',
        providerName: 'provider',
        projectAuthor: 'author',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        await initGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
    });
});
