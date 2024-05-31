import {
    newProject,
    createNextApplication,
    runTarget,
    targetOptions,
} from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
    readFile,
    uniq,
} from '@nx/plugin/testing';
import { Project, SyntaxKind } from 'ts-morph';

describe('playwright e2e', () => {
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'true';
    process.env.HUSKY = '0';
    jest.setTimeout(1_000_000);
    async function setupBaseProject() {
        const baseProject = uniq('playwright');
        const e2eProject = `${baseProject}`;
        await runNxCommandAsync(
            `generate @nx/next:application ${baseProject} --directory=apps --e2eTestRunner=none`,
        );
        await runNxCommandAsync(
            `generate @ensono-stacks/playwright:init --project=${baseProject} --no-interactive`,
        );
        return { baseProject, e2eProject };
    }

    beforeAll(async () => {
        await newProject(['@ensono-stacks/playwright'], [
            '@nx/playwright',
            '@nx/next',
        ]);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    it('errors when the project does not exist', async () => {
        const project = uniq('imaginaryProjectThatDoesNotExist');
        await runNxCommandAsync(
            `generate @ensono-stacks/playwright:init ${project}`,
        ).catch(stderr => expect(stderr?.code).toEqual(1));
    });

    describe('init generator', () => {
        let e2eProject, projectE2EName;
        beforeAll(async () => {
            e2eProject = (await setupBaseProject()).e2eProject;
            projectE2EName = `${e2eProject}-e2e`
        });

        it('should successfully run and amend config files if project does exist', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${projectE2EName}/playwright.config.ts`,
                ),
            ).not.toThrow();
        });

        it('should be able to run the e2e test target', async () => {
            // The tests will actually fail to run as Playwright detects that it is being run with jest. So only able to verify that the target is ran and server started
            expect(
                await runTarget(
                    projectE2EName,
                    targetOptions.e2e,
                    '--grep="whats next" --testProject="chromium"',
                ),
            ).toContain(
                'ready started server on 0.0.0.0:4200, url: http://localhost:4200',
            );
        });
    });

    describe('accessibility generator', () => {
        let e2eProject, projectE2EName;
        beforeAll(async () => {
            e2eProject = (await setupBaseProject()).e2eProject;
            projectE2EName = `${e2eProject}-e2e`
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:accessibility --project=${projectE2EName} --no-interactive`,
            );
        });

        it('should successfully add accessibility test files and add dependencies', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${projectE2EName}/playwright.config.ts`,
                    `apps/${projectE2EName}/src/axe-accessibility.spec.ts`,
                ),
            ).not.toThrow();

            // add axe packages to package.json
            const packageJson = readJson('package.json');
            expect(packageJson?.devDependencies).toMatchObject({
                '@axe-core/playwright': '4.9.0',
                'axe-result-pretty-print': '1.0.2',
            });
        });
    });

    describe('Visual - native generator', () => {
        let e2eProject, projectE2EName;
        beforeAll(async () => {
            e2eProject = (await setupBaseProject()).e2eProject;
            projectE2EName = `${e2eProject}-e2e`
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:visual-regression --project=${projectE2EName} --type=native --no-interactive`,
            );
        });

        it('should successfully add native regression config', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${projectE2EName}/playwright.config.ts`,
                    `apps/${projectE2EName}/src/playwright-visual-regression.spec.ts`,
                ),
            ).not.toThrow();

            // expect playwright.config.ts to be amended with native regression config
            const projectConfig = readFile(
                `apps/${projectE2EName}/playwright.config.ts`,
            );
            expect(projectConfig).toContain('maxDiffPixelRatio: 0.05');
            expect(projectConfig).toContain('threshold: 0.2');
        });
    });

    describe('visual - applitools generator', () => {
        let e2eProject, projectE2EName;
        beforeAll(async () => {
            e2eProject = (await setupBaseProject()).e2eProject;
            projectE2EName = `${e2eProject}-e2e`
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:visual-regression --project=${projectE2EName} --type=applitools --no-interactive`,
            );
        });

        it('should successfully add applitools regression config and add dependencies', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${projectE2EName}/playwright.config.ts`,
                    `apps/${projectE2EName}/src/applitools-eyes-grid.spec.ts`,
                ),
            ).not.toThrow();

            const packageJson = readJson('package.json');
            expect(packageJson?.devDependencies).toMatchObject({
                '@applitools/eyes-playwright': '1.27.2'
            });

            const projectConfig = readFile(
                `apps/${projectE2EName}/playwright.config.ts`,
            );

            expect(projectConfig).toContain('grepInvert: /.*@visual-regression/');
        });
    });
});
