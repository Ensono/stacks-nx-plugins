import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import initGenerator from '../init/generator';
import generator from './generator';
import { AccessibilityGeneratorSchema } from './schema';

describe('playwright accessibility generator', () => {
    let appTree: Tree;
    const projectName = 'test-e2e';

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: projectName,
            accessibility: true,
        };
        await initGenerator(appTree, options);
        await generator(appTree, options);

        // axe-accessibility.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'axe-accessibility.spec.ts',
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf-8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@axe-core/playwright': '4.5.2',
            'axe-result-pretty-print': '1.0.2',
        });
    }, 20_000);
});
