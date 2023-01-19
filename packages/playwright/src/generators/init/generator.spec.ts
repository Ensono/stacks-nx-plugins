import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

describe('playwright generator', () => {
    let appTree: Tree;
    const options: PlaywrightGeneratorSchema = {
        project: 'test',
        accessibility: false,
        visualRegression: 'none',
    };

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        await generator(appTree, options);
        const config = readProjectConfiguration(appTree, 'test');
        expect(config).toBeDefined();
    });
});
