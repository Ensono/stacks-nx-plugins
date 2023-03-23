import { testUpdateStacksConfig } from '@ensono-stacks/core';
import { readJson, Tree, updateJson } from '@nrwl/devkit';
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
    let options: AccessibilityGeneratorSchema;

    beforeEach(() => {
        options = {
            project: projectName,
            accessibility: true,
        };
        appTree = createTreeWithEmptyWorkspace();

        testUpdateStacksConfig(appTree, options.project);
    });

    it('should run successfully', async () => {
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

    describe('executedGenerators', () => {
        it('should update nx.json and tag executed generator true', async () => {
            await initGenerator(appTree, options);
            await generator(appTree, options);

            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('PlaywrightAccessibility'),
            ).toBeTruthy();
            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('PlaywrightAccessibility'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            await initGenerator(appTree, options);
            await generator(appTree, options);

            updateJson(appTree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    executedGenerators: {
                        project: {
                            [options.project]: ['PlaywrightAccessibility'],
                        },
                    },
                },
            }));

            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
