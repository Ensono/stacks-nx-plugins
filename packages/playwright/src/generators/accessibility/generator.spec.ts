import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import {
    AXE_CORE_PLAYWRIGHT_VERSION,
    AXE_RESULTS_PRETTY_PRINT_VERSION,
} from '../../utils/versions';
import initGenerator from '../init/generator';
import generator from './generator';
import { AccessibilityGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

jest.mock('@nrwl/devkit', () => {
    const actual = jest.requireActual('@nrwl/devkit');

    return {
        ...actual,
        getProjects: jest.fn(
            () =>
                new Map([
                    [
                        'test',
                        {
                            root: '',
                            sourceRoot: `${projectName}/src`,
                            name: 'test',
                        },
                    ],
                    [
                        'test-e2e',
                        {
                            root: '',
                            sourceRoot: `${projectNameE2E}/src`,
                            name: 'test-e2e',
                        },
                    ],
                ]),
        ),
    };
});

describe('playwright accessibility generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        addStacksAttributes(appTree, projectName);
    });

    it('should error if the project does not supported', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: 'non-supported-project',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `non-supported-project is not an e2e project. Please select a supported target.`,
        );
    });

    it('should error if the project does not exist', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: 'non-existent-project-e2e',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `non-existent-project-e2e does not exist`,
        );
    });

    it('should run successfully', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: projectNameE2E,
        };

        await initGenerator(appTree, options);
        await generator(appTree, options);

        // axe-accessibility.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'axe-accessibility.spec.ts',
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf-8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
            'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
        });
    }, 100_000);
});
