import { newProject, createNextApplication, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
    readFile,
    uniq,
} from '@nx/plugin/testing';

describe('playwright e2e', () => {
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'true';
    process.env.HUSKY = '0';

    async function setupBaseProject() {
        const baseProject = uniq('playwright');
        const e2eProject = `${baseProject}-e2e`;

        await createNextApplication(baseProject);

        await runNxCommandAsync(
            `generate @ensono-stacks/playwright:init --project=${baseProject} --directory=apps/${e2eProject} --no-interactive`,
        );

        return { baseProject, e2eProject };
    }

    beforeAll(async () => {
        await newProject(
            ['@ensono-stacks/playwright', '@ensono-stacks/next'],
            ['@nx/playwright', '@nx/next'],
        );
    });

    afterAll(async () => {
        cleanup();
    });

    it('errors when the project does not exist', async () => {
        const project = uniq('imaginaryProjectThatDoesNotExist');

        await runNxCommandAsync(
            `generate @ensono-stacks/playwright:init ${project}`,
        ).catch(stderr => expect(stderr?.code).toEqual(1));
    });

    describe('init generator', () => {
        let e2eProject: string;
        let baseProject: string;

        beforeAll(async () => {
            const proj = await setupBaseProject();

            e2eProject = proj.e2eProject;
            baseProject = proj.baseProject;
        });

        it('should successfully run and amend config files if project does exist', async () => {
            expect(() =>
                checkFilesExist(`apps/${e2eProject}/playwright.config.ts`),
            ).not.toThrow();
        });
    });

    describe('accessibility generator', () => {
        let e2eProject: string;

        beforeAll(async () => {
            const proj = await setupBaseProject();

            e2eProject = proj.e2eProject;
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:accessibility --project=${e2eProject} --no-interactive`,
            );
        });

        it('should successfully add accessibility test files and add dependencies', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/axe-accessibility.spec.ts`,
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
        let e2eProject = '';

        beforeAll(async () => {
            const proj = await setupBaseProject();

            e2eProject = proj.e2eProject;

            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:visual-regression --project=${e2eProject} --type=native --no-interactive`,
            );
        });

        it('should successfully add native regression config', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/playwright-visual-regression.spec.ts`,
                ),
            ).not.toThrow();

            // expect playwright.config.ts to be amended with native regression config
            const projectConfig = readFile(
                `apps/${e2eProject}/playwright.config.ts`,
            );

            expect(projectConfig).toContain('maxDiffPixelRatio: 0.05');
            expect(projectConfig).toContain('threshold: 0.2');
        });
    });

    describe('visual - applitools generator', () => {
        let e2eProject = '';

        beforeAll(async () => {
            const proj = await setupBaseProject();

            e2eProject = proj.e2eProject;
            await runNxCommandAsync(
                `generate @ensono-stacks/playwright:visual-regression --project=${e2eProject} --type=applitools --no-interactive`,
            );
        });

        it('should successfully add applitools regression config and add dependencies', async () => {
            expect(() =>
                checkFilesExist(
                    `apps/${e2eProject}/playwright.config.ts`,
                    `apps/${e2eProject}/src/applitools-eyes-grid.spec.ts`,
                ),
            ).not.toThrow();

            const packageJson = readJson('package.json');

            expect(packageJson?.devDependencies).toMatchObject({
                '@applitools/eyes-playwright': '1.27.2',
            });

            const projectConfig = readFile(
                `apps/${e2eProject}/playwright.config.ts`,
            );

            expect(projectConfig).toContain(
                'grepInvert: /.*@visual-regression/',
            );
        });
    });
});
