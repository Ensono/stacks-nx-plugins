import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    readFile,
    uniq,
} from '@nx/plugin/testing';
import { Project, SyntaxKind } from 'ts-morph';

describe('playwright e2e', () => {
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'true';

    function setupBaseProject() {
        const baseProject = uniq('playwright');
        const e2eProject = `${baseProject}-e2e`;
        runNxCommand(
            `generate @nrwl/next:application ${baseProject} --e2eTestRunner=none`,
        );
        return { baseProject, e2eProject };
    }

    beforeAll(async () => {
        await newProject(
            ['@ensono-stacks/playwright'],
            ['@mands/nx-playwright', '@nrwl/next'],
        );
    }, 200_000);

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    describe('--project', () => {
        it('errors when the project does not exist', async () => {
            const project = uniq('imaginaryProjectThatDoesNotExist');
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:init ${project}`,
            ).catch(stderr => expect(stderr?.code).toEqual(1));
        }, 200_000);

        it('should successfully run and amend config files if project does exist', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial playwright project and amend playwright config files
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:init --project=${baseProject} --no-interactive`,
            );
            expect(() =>
                checkFilesExist(
                    'playwright.config.base.ts',
                    `apps/${e2eProject}/playwright.config.ts`,
                ),
            ).not.toThrow();

            // expect playwright.base.config.ts to be altered
            const baseConfig = readFile('playwright.config.base.ts');
            const baseConfigFile = new Project().createSourceFile(
                'playwright.config.base.ts',
                baseConfig,
            );
            const baseConfigObject = baseConfigFile
                ?.getVariableDeclaration('baseConfig')
                ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

            expect(
                baseConfigObject?.getProperty('maxFailures')?.getStructure(),
            ).toEqual(
                expect.objectContaining({
                    initializer: 'process.env.CI ? 10 : undefined',
                }),
            );
            expect(
                baseConfigObject?.getProperty('fullyParallel')?.getStructure(),
            ).toEqual(
                expect.objectContaining({
                    initializer: 'true',
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
                baseConfigObject?.getProperty('retries')?.getStructure(),
            ).toEqual(
                expect.objectContaining({
                    initializer: 'process.env.CI ? 2 : undefined',
                }),
            );

            // expect playwright.config.ts to be altered
            const projectConfig = readFile(
                `apps/${e2eProject}/playwright.config.ts`,
            );
            const projectConfigFile = new Project().createSourceFile(
                'playwright.base.ts',
                projectConfig,
            );
            const projectConfigObject = projectConfigFile
                ?.getVariableDeclaration('config')
                ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
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
        }, 200_000);
    });

    describe('accessibility generator', () => {
        it('should successfully add accessibility test files and add dependencies', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial playwright project
            runNxCommand(
                `generate @ensono-stacks/playwright:init --project=${baseProject} --no-interactive`,
            );
            // amend playwright config files
            runNxCommand(
                `generate @ensono-stacks/playwright:accessibility --project=${e2eProject} --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    'playwright.config.base.ts',
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/axe-accessibility.spec.ts`,
                ),
            ).not.toThrow();

            // add axe packages to package.json
            const packageJson = readJson('package.json');
            expect(packageJson?.devDependencies).toMatchObject({
                '@axe-core/playwright': '4.5.2',
                'axe-result-pretty-print': '1.0.2',
            });
        }, 200_000);
    });

    describe('visual regression generator', () => {
        it('should successfully add native regression config', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial playwright project
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:init --project=${baseProject} --no-interactive`,
            );
            // amend playwright config files
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:visual-regression --project=${e2eProject} --type=native --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    'playwright.config.base.ts',
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/playwright-visual-regression.spec.ts`,
                ),
            ).not.toThrow();

            // expect playwright.config.ts to be ameneded with native regression config
            const projectConfig = readFile(
                `apps/${e2eProject}/playwright.config.ts`,
            );
            const projectConfigFile = new Project().createSourceFile(
                'playwright.base.ts',
                projectConfig,
            );
            const projectConfigObject = projectConfigFile
                ?.getVariableDeclaration('config')
                ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
        }, 200_000);

        it('should successfully add applitools regression config and add dependencies', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial playwright project
            runNxCommand(
                `generate @ensono-stacks/playwright:init --project=${baseProject} --no-interactive`,
            );
            // amend playwright config files
            runNxCommand(
                `generate @ensono-stacks/playwright:visual-regression --project=${e2eProject} --type=applitools --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    'playwright.config.base.ts',
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/applitools-eyes-grid.spec.ts`,
                ),
            ).not.toThrow();

            // expect playwright.config.ts to be ameneded with native regression config
            const projectConfig = readFile(
                `apps/${e2eProject}/playwright.config.ts`,
            );
            const projectConfigFile = new Project().createSourceFile(
                'playwright.base.ts',
                projectConfig,
            );
            const projectConfigObject = projectConfigFile
                ?.getVariableDeclaration('config')
                ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            expect(
                projectConfigObject?.getProperty('grepInvert')?.getStructure(),
            ).toEqual(
                expect.objectContaining({
                    initializer: '/.*@visual-regression/',
                }),
            );
        }, 200_000);
    });
});
