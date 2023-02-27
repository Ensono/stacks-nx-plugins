import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { SyntaxKind } from 'ts-morph';
import YAML from 'yaml';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

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

describe('playwright generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        appTree.write(
            'taskctl.yaml',
            YAML.stringify({
                pipelines: { dev: [], fe: [], nonprod: [], prod: [] },
            }),
        );
        appTree.write('build/tasks.yaml', YAML.stringify({ tasks: {} }));
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/tasks.yaml');
    });

    it('should error if the project already exists', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: `${projectName}`,
        };

        await generator(appTree, options);
        await expect(generator(appTree, options)).rejects.toThrowError(
            `Cannot create a new project ${projectNameE2E} at ./${projectNameE2E}. It already exists.`,
        );
    }, 100_000);

    it('should run successfully with default options', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
        };
        await generator(appTree, options);

        // example.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'example.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.base.ts to be updated
        const baseConfigFile = project.addSourceFileAtPath(
            'playwright.config.base.ts',
        );
        const baseConfigObject = baseConfigFile
            ?.getVariableDeclaration('baseConfig')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            baseConfigObject?.getProperty('maxFailures')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: 'process.env.CI ? 10 : undefined',
            }),
        );
        expect(
            baseConfigObject?.getProperty('forbidOnly')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: '!!process.env.CI',
            }),
        );
        expect(
            baseConfigFile
                .getVariableDeclaration('baseURL')
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .find(identifier => identifier.getText() === 'BASE_URL'),
        ).toBeTruthy();

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            projectConfigObject?.getProperty('use')?.getStructure(),
        ).toBeTruthy();
        expect(
            projectConfigObject?.getProperty('projects')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `[
                      {
                        name: 'chromium',
                        use: {
                          ...devices['Desktop Chrome'],
                        },
                      },
                      {
                        name: 'firefox',
                        use: {
                          ...devices['Desktop Firefox'],
                        },
                      },

                      {
                        name: 'webkit',
                        use: {
                          ...devices['Desktop Safari'],
                        },
                      },

                      /* Test against mobile viewports. */
                      {
                        name: 'Mobile Chrome',
                        use: {
                          ...devices['Pixel 5'],
                        },
                      },
                      {
                        name: 'Mobile Safari',
                        use: {
                          ...devices['iPhone 12'],
                        },
                      },
                    ]`,
            }),
        );

        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf-8');
        expect(gitIgnoreFile).toContain('**/test-results');
        expect(gitIgnoreFile).toContain('**/playwright-report');
        expect(gitIgnoreFile).toContain('**/playwright/.cache');

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
    }, 100_000);
});
