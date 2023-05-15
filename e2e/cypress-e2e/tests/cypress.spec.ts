import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

import {
    CYPRESS,
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
            expect(packageJson.devDependencies['cypress']).toBe(CYPRESS);
            expect(packageJson.devDependencies['@nrwl/cypress']).toBe(NRWLCYPRESS);
            expect(packageJson.devDependencies['cypress-multi-reporters']).toBe(
                CYPRESSMULTIREPORTERS,
            );
            expect(packageJson.devDependencies['mochawesome']).toBe(MOCHAWESOME);
            expect(packageJson.devDependencies['mochawesome-merge']).toBe(
                MOCHAWESOMEMERGE,
            );
            expect(packageJson.devDependencies['mocha-junit-reporter']).toBe(
                MOCHAWESOMEJUNITREPORTER,
            );
        }, 200_000);

    });

});
