import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

import {
    AXECORE,
    CYPRESS,
    CYPRESSAXE,
    CYPRESSMULTIREPORTERS,
    MOCHAWESOME,
    MOCHAWESOMEJUNITREPORTER,
    MOCHAWESOMEMERGE,
    NRWLCYPRESS,
} from '../../../packages/cypress/src/versions';

describe('cypress e2e', () => {

    function setupBaseProject() {
        const baseProject = uniq('cypress');
        const e2eProject = `${baseProject}-e2e`;
        runNxCommand(
            `generate @nrwl/next:application ${baseProject} --e2eTestRunner=none`,
        );
        return { baseProject, e2eProject };
    }

    beforeAll(async () => {
        await newProject(
            ['@nrwl/cypress', '@nrwl/next'],
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
                `generate @ensono-stacks/cypress:init ${project}`,
            ).catch(stderr => expect(stderr?.code).toEqual(1));
        }, 200_000);

        it('should successfully run and amend config files if project does exist', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial cypress project and amend cypress config files
            await runNxCommandAsync(
                `generate @ensono-stacks/cypress:init --project=${baseProject} --no-interactive`,
            )
            expect(() =>
                checkFilesExist(
                    'cypress.config.base.ts',
                    `apps/${e2eProject}/cypress.config.ts`,
                    `apps/${e2eProject}/project.json`,
                    `apps/${e2eProject}/src/e2e/example.cy.ts`,
                    `apps/${e2eProject}/src/support/e2e.ts`,
                    `apps/${e2eProject}/tsconfig.json`,
                    `apps/${e2eProject}/cypress.config.ts`,

                ),
            ).not.toThrow();

            expect(checkFilesExist(`apps/${e2eProject}/src/support/e2e.ts`)).toThrow();
            expect(checkFilesExist(`apps/${e2eProject}/src/support/app.po.ts`)).toThrow();
            expect(checkFilesExist(`apps/${e2eProject}/src/e2e/app.cy.ts`)).toThrow();

            const projectJson = readJson(`apps/${e2eProject}/project.json`);
            expect(projectJson.targets.e2e).toBeTruthy();
            expect(projectJson.targets['html-report']).toBeTruthy();

            // add packages to package.json
            const packageJson = readJson('package.json');
            expect(packageJson?.devDependencies).toMatchObject({
                cypress: CYPRESS,
                '@nrwl/cypress': NRWLCYPRESS,
                'cypress-multi-reporters': CYPRESSMULTIREPORTERS,
                mochawesome: MOCHAWESOME,
                'mochawesome-merge': MOCHAWESOMEMERGE,
                'mocha-junit-reporter': MOCHAWESOMEJUNITREPORTER,
            });
        }, 200_000);

    });

    describe('accessibility generator', () => {
        it('should successfully add accessibility test files and add dependencies', async () => {
            const { baseProject, e2eProject } = setupBaseProject();

            // generate initial playwright project
            runNxCommand(
                `generate @ensono-stacks/cypress:init --project=${baseProject} --no-interactive`,
            );
            // amend playwright config files
            runNxCommand(
                `generate @ensono-stacks/cypress:accessibility --project=${e2eProject} --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `apps/${e2eProject}/cypress/e2e/axe-accessibility.cy.ts`,
                ),
            ).not.toThrow();

            // add axe packages to package.json
            const packageJson = readJson('package.json');
            expect(packageJson?.devDependencies).toMatchObject({
                'axe-core': AXECORE,
                'cypress-axe': CYPRESSAXE,
            });
        }, 200_000);
    });

});
