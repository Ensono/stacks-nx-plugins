import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { AccessibilityGeneratorSchema } from './schema';
import {
    AXE_CORE_PLAYWRIGHT_VERSION,
    AXE_RESULTS_PRETTY_PRINT_VERSION,
} from '../../utils/versions';
import initGenerator from '../init/generator';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

describe('playwright accessibility generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        addStacksAttributes(appTree, projectName);
    });

    it('should error if the project is not supported', async () => {
        addProjectConfiguration(appTree, 'test', {
            root: projectName,
            sourceRoot: projectName,
            projectType: 'application',
        });

        const options: AccessibilityGeneratorSchema = {
            project: 'test',
        };
        await expect(generator(appTree, options)).rejects.toThrow(
            `test is not an e2e project. Please select a supported target.`,
        );
    });

    it('should error if the project does not exist', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: 'non-existent-project-e2e',
        };
        await expect(generator(appTree, options)).rejects.toThrow(
            `non-existent-project-e2e does not exist`,
        );
    });

    it('should run successfully', async () => {
        addProjectConfiguration(appTree, projectName, {
            projectType: 'application',
            sourceRoot: projectName,
            root: projectName,
        });

        await initGenerator(appTree, {
            project: projectName,
            directory: projectNameE2E,
        });
        await generator(appTree, {
            project: projectNameE2E,
        });

        // axe-accessibility.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'axe-accessibility.spec.ts',
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
            'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
        });
    }, 100_000);
});
