import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

import generator from './generator';
import { HttpClientGeneratorSchema } from './schema';

describe('rest-client generator', () => {
  let appTree: Tree;
  const options: HttpClientGeneratorSchema = { name: 'test', unitTestRunner: 'jest', linter: 'eslint' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
