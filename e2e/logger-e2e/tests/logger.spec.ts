import { newProject } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    cleanup,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';

describe('logger e2e', () => {
    jest.setTimeout(200_000);

    beforeAll(async () => {
        await newProject(['@ensono-stacks/logger']);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('winston generator', () => {
        it('should create logger', async () => {
            const project = uniq('logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger:winston ${project}`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
        });

        describe('--directory', () => {
            it('should create src in the specified directory', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --directory subdir`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/subdir/${project}/src/index.ts`,
                        `libs/subdir/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });

        describe('--tags', () => {
            it('should add tags to the project', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --tags e2etag,e2ePackage`,
                );
                const projectJson = readJson(`libs/${project}/project.json`);
                expect(projectJson.tags).toEqual(['e2etag', 'e2ePackage']);
            });
        });

        describe('--logLevelType', () => {
            it('should create src with "cli" log level type', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --logLevelType cli`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });

            it('should create src with "npm" log level type', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --logLevelType npm`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });

            it('should create src with "syslog" log level type', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --logLevelType syslog`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });

            it('should error with invalid log level type', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --logLevelType errorLog`,
                ).catch(stderr => expect(stderr?.code).toEqual(1));
            });
        });

        describe('--consoleLog', () => {
            it('should create src with console log transport being set to true', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --consoleLog`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });

        describe('--fileTransportPath', () => {
            it('should create src with file transport path', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --fileTransportPath=/logs/log.log`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });

        describe('--httpTransport', () => {
            it('should create src with http transport being set', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --httpTransportHost=localhost --httpTransportPort=3000 --httpTransportPath=somePath --httpTransportSSL`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });

        describe('--streamPath', () => {
            it('should create src with stream path being set', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --streamPath=/somePath`,
                );
                expect(() =>
                    checkFilesExist(
                        `libs/${project}/src/index.ts`,
                        `libs/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });
    });
});
