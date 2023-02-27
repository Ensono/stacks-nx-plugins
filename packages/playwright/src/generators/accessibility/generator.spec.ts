import { Tree } from '@nrwl/devkit';
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
                            sourceRoot: `${projectNameE2E}/src`,
                            name: 'test',
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
    });

    it('should run successfully', async () => {
        const options: AccessibilityGeneratorSchema = {
            project: projectName,
            accessibility: true,
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
