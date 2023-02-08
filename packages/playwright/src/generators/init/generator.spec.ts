import { tsMorphTree } from '@ensono-stacks/core';
import initPlaywrightGenerator from '@mands/nx-playwright/src/generators/project/generator';
import { NxPlaywrightGeneratorSchema } from '@mands/nx-playwright/src/generators/project/schema-types';
import { PackageRunner } from '@mands/nx-playwright/src/types';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Linter } from '@nrwl/linter';
import { SyntaxKind } from 'ts-morph';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

describe('playwright generator', () => {
    let appTree: Tree;
    const projectName = 'test-e2e';

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
    });

    it('should error if the project does not exist', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'none',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `${projectName} project does not exist`,
        );
    });

    it('should run successfully with default options', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);

        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'none',
        };
        await generator(appTree, options);

        // example.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
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
            `${projectName}/playwright.config.ts`,
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
    });

    it('should run successfully with accessibility enabled', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: true,
            visualRegression: 'none',
        };
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
    });

    it('should run successfully with native regression', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'native',
        };
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'playwright-visual-regression.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            projectConfigObject?.getProperty('updateSnapshots')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `'missing'`,
            }),
        );
        expect(
            projectConfigObject?.getProperty('expect')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `{
                        toHaveScreenshot: {
                          threshold: 0.2,
                          animations: 'disabled',
                        },
                      }`,
            }),
        );
    });

    it('should run successfully with applitools regression', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'applitools',
        };
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'applitools-eyes-grid.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
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
    });
});
