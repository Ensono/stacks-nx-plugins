import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { SyntaxKind } from 'ts-morph';

import { APPLITOOLS_EYES_PLAYWRIGHT_VERSION } from '../../utils/versions';
import initGenerator from '../init/generator';
import generator from './generator';
import { VisualRegressionGeneratorSchema } from './schema';

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

describe('playwright generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should error if the project does not exist', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: 'non-existent-project',
            visualRegression: 'none',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `non-existent-project does not exist`,
        );
    });

    it('should run successfully with native regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectNameE2E,
            visualRegression: 'native',
        };
        await initGenerator(appTree, { project: projectName });
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'playwright-visual-regression.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/playwright.config.ts`,
        );

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );

        expect(projectJson.targets.e2e).toBeTruthy();
        expect(projectJson.targets['e2e-docker']).toBeTruthy();
        const playwrightPackageJsonVersion = readJson(appTree, 'package.json')
            ?.devDependencies?.playwright;
        expect(playwrightPackageJsonVersion).toBeTruthy();
        expect(
            projectJson.targets['e2e-docker']?.options?.commands[0]?.command,
        ).toContain(
            `mcr.microsoft.com/playwright:v${playwrightPackageJsonVersion?.replace(
                '^',
                '',
            )}`,
        );
    }, 100_000);

    it('should run successfully with applitools regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectNameE2E,
            visualRegression: 'applitools',
        };
        await initGenerator(appTree, { project: projectName });
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'applitools-eyes-grid.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            projectConfigObject?.getProperty('grepInvert')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: '/.*@visual-regression/',
            }),
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf-8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@applitools/eyes-playwright': APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
        });
    }, 100_000);
});
