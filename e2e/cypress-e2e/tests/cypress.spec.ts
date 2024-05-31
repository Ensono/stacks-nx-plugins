import { newProject, runTarget, targetOptions } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';

import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    AXECORE_VERSION,
    CYPRESSAXE_VERSION,
} from '../../../packages/cypress/src/versions';

let baseProject, applicationDirectory, cypressDirectory;
describe('cypress e2e', () => {
    jest.setTimeout(1_000_000);

    function setupBaseProject() {
        baseProject = uniq('cypress');
        applicationDirectory = `apps/${baseProject}`;
        cypressDirectory = `${applicationDirectory}-e2e`;
        runNxCommand(
            `generate @nx/next:application ${baseProject} --directory=apps/${baseProject} --e2eTestRunner=none --style=none --appDir=false --src=true --projectNameAndRootFormat=as-provided --verbose`,
        );
        return { baseProject, applicationDirectory, cypressDirectory };
    }

    beforeAll(async () => {
        await newProject(['@ensono-stacks/cypress'], ['@nx/next']);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('--project', () => {
        it('errors when the project does not exist', async () => {
            const project = uniq('imaginaryProjectThatDoesNotExist');
            await runNxCommandAsync(
                `generate @ensono-stacks/cypress:init ${project}`,
            ).catch(stderr => expect(stderr?.code).toEqual(1));
        });

        describe('should successfully run and amend config files if project does exist', () => {
            beforeAll(async () => {
                setupBaseProject();
                await runNxCommandAsync(
                    `generate @ensono-stacks/cypress:init --project=${baseProject} --no-interactive --verbose`,
                );
            });

            it('should add/update the relevant files', () => {
                expect(() =>
                    checkFilesExist(
                        `${cypressDirectory}/cypress.config.ts`,
                        `${cypressDirectory}/project.json`,
                        `${cypressDirectory}/src/e2e/app.cy.ts`,
                        `${cypressDirectory}/src/support/e2e.ts`,
                        `${cypressDirectory}/tsconfig.json`,
                    ),
                ).not.toThrow();
            });

            it('should update the package.json', () => {
                const packageJson = readJson('package.json');
                expect(packageJson?.devDependencies).toMatchObject({
                    cypress: CYPRESS_VERSION,
                    'cypress-multi-reporters': CYPRESSMULTIREPORTERS_VERSION,
                    mochawesome: MOCHAWESOME_VERSION,
                    'mochawesome-merge': MOCHAWESOMEMERGE_VERSION,
                    'mocha-junit-reporter': MOCHAWESOMEJUNITREPORTER_VERSION,
                });
            });

            describe('should be a runnable test suite', () => {
                
                let results;
                beforeAll(async () => {
                    process.env.CI = 'true';
                    results =
                        await runTarget(
                            `${baseProject}-e2e`,
                            targetOptions.e2e,
                            undefined,
                            '--env.grep="should be up and running"',
                        );
                });

                it('should run the e2e tests', () => {
                    expect(results).toContain(
                        `Successfully ran target e2e for project ${baseProject}`,
                    );
                });

                
                describe('should run executor to produce html reports', () => {
                    beforeAll(async () => {
                        results =
                        await runTarget(
                            `${baseProject}-e2e`,
                            targetOptions['html-report'],
                            undefined,
                            '--configuration=ci'
                        );
                    });

                    it('should produce html and json reports as output', () => {
                        expect(results).toContain(`Successfully ran target html-report for project ${baseProject}`);
                        expect(() =>
                            checkFilesExist(
                                `test-results/${baseProject}-e2e/downloads/mochawesome-report/merged-html-report.html`,
                                `test-results/${baseProject}-e2e/downloads/merged-html-report.json`,
                            ),
                        ).not.toThrow();
                    });
                });
            });

            it('should successfully add accessibility test files and add dependencies', async () => {
                runNxCommand(
                    `generate @ensono-stacks/cypress:accessibility --project=${baseProject} --no-interactive`,
                );

                expect(() =>
                    checkFilesExist(
                        `${cypressDirectory}/src/e2e/axe-accessibility.cy.ts`,
                    ),
                ).not.toThrow();

                // add axe packages to package.json
                const packageJson = readJson('package.json');
                expect(packageJson?.devDependencies).toMatchObject({
                    'axe-core': AXECORE_VERSION,
                    'cypress-axe': CYPRESSAXE_VERSION,
                });
            });
           
        });
    });
});