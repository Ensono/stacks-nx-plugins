import {
    checkFilesExist,
    cleanup,
    ensureNxProject,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

describe('logger-client e2e', () => {

    beforeAll(() => {
        ensureNxProject(
            '@ensono-stacks/logger-client',
            'dist/packages/logger-client',
        );
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    it('should create logger-client', async () => {
        const project = uniq('logger-client');
        await runNxCommandAsync(
            `generate @ensono-stacks/logger-client:logger-client ${project}`,
        );
        expect(() =>
        checkFilesExist(
            `libs/${project}/src/index.ts`,
            `libs/${project}/src/index.test.ts`
            ),
        ).not.toThrow();
    }, 120000);

    describe('--directory', () => {
        it('should create src in the specified directory', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --directory subdir`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/subdir/${project}/src/index.ts`,
                    `libs/subdir/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);
    });

    describe('--tags', () => {
        it('should add tags to the project', async () => {
            const project = uniq('logger-client');
            ensureNxProject(
                '@ensono-stacks/logger-client',
                'dist/packages/logger-client',
            );
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --tags e2etag,e2ePackage`,
            );
            const projectJson = readJson(`libs/${project}/project.json`);
            expect(projectJson.tags).toEqual(['e2etag', 'e2ePackage']);
        }, 120000);
    });

    describe('--logLevelType', () => {
        beforeAll(() => {
            ensureNxProject(
                '@ensono-stacks/logger-client',
                'dist/packages/logger-client',
            );
        });

        it('should create src with "cli" log level type', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --logLevelType cli`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with "npm" log level type', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --logLevelType npm`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with "syslog" log level type', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --logLevelType syslog`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should error with invalid log level type', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --logLevelType errorLog`,
            ).catch((stderr) => expect(stderr?.code).toEqual(1));
        }, 120000);
    });

    describe('--consoleLog', () => {
        it('should create src with console log transport being set to true', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --consoleLog`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);
    });

    describe('--fileTransportPath', () => {
        it('should create src with file transport path', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --fileTransportPath=/logs/log.log`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);
    });

    describe('--httpTransport', () => {
        beforeEach(() => {
            ensureNxProject(
                '@ensono-stacks/logger-client',
                'dist/packages/logger-client',
            );
        });
        
        it('should create src with http transport being set to true', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --httpTransport`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with http transport being set to true and httpTransportHost being set', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --httpTransport --httpTransportHost=localhost`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with http transport being set to true and httpTransportPort being set', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --httpTransport --httpTransportPort=3000`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with http transport being set to true and httpTransportPath being set', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --httpTransport --httpTransportPath=somePath`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with http transport being set to true and httpTransportSSL being set to true', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --httpTransport --httpTransportSSL`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);
    });

    describe('--streamPath', () => {
        it('should create src with stream path being set', async () => {
            const project = uniq('logger-client');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger-client:logger-client ${project} --streamPath=/somePath`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);
    });
});
