import {
    checkFilesExist,
    cleanup,
    ensureNxProject,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

describe('node-logger e2e', () => {

    beforeAll(() => {
        ensureNxProject(
            '@ensono-stacks/node-logger',
            'dist/packages/node-logger',
        );
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    it('should create node-logger', async () => {
        const project = uniq('node-logger');
        await runNxCommandAsync(
            `generate @ensono-stacks/node-logger:node-logger ${project}`,
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
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --directory subdir`,
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
            const project = uniq('node-logger');
            ensureNxProject(
                '@ensono-stacks/node-logger',
                'dist/packages/node-logger',
            );
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --tags e2etag,e2ePackage`,
            );
            const projectJson = readJson(`libs/${project}/project.json`);
            expect(projectJson.tags).toEqual(['e2etag', 'e2ePackage']);
        }, 120000);
    });

    describe('--logLevelType', () => {
        beforeAll(() => {
            ensureNxProject(
                '@ensono-stacks/node-logger',
                'dist/packages/node-logger',
            );
        });

        it('should create src with "cli" log level type', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --logLevelType cli`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with "npm" log level type', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --logLevelType npm`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should create src with "syslog" log level type', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --logLevelType syslog`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`
                    ),
            ).not.toThrow();
        }, 120000);

        it('should error with invalid log level type', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --logLevelType errorLog`,
            ).catch((stderr) => expect(stderr?.code).toEqual(1));
        }, 120000);
    });

    describe('--consoleLog', () => {
        it('should create src with console log transport being set to true', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --consoleLog`,
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
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --fileTransportPath=/logs/log.log`,
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
                '@ensono-stacks/node-logger',
                'dist/packages/node-logger',
            );
        });

        it('should create src with http transport being set', async () => {
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --httpTransport --httpTransportHost=localhost --httpTransportPort=3000 --httpTransportPath=somePath --httpTransportSSL`,
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
            const project = uniq('node-logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/node-logger:node-logger ${project} --streamPath=/somePath`,
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
