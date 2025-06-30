import { Tree, readJson } from '@nx/devkit';

import { createNextApp } from './create-next-app';

describe('create next app', () => {
    let tree: Tree;

    it('should add stacks attributes to nx.json and return with the values', async () => {
        tree = await createNextApp('application');
        const nxJson = readJson(tree, 'nx.json');
        expect(nxJson.stacks).toBeTruthy();
        expect(tree.exists('apps/application/next.config.js')).toBeTruthy();
    });
});
