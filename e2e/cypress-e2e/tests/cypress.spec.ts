import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

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
            
        }, 200_000);
    });

});
