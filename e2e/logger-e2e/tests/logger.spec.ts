import { newProject,
        runTarget,
        targetOptions, 
} from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';

describe('logger e2e', () => {
    jest.setTimeout(1_000_000);

    beforeAll(async () => {
        await newProject('@ensono-stacks/logger');
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('winston generator', () => {
        it('should create logger and with all cli arguments', async () => {
            const project = uniq('logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger:winston ${project} --tags e2etag,e2ePackage --logLevelType npm --consoleLog --fileTransportPath=/logs/log.log --httpTransportHost=localhost --httpTransportPort=3000 --httpTransportPath=somePath --httpTransportSSL --streamPath=/somePath`,
            );
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
            const projectJson = readJson(`libs/${project}/project.json`);
            expect(projectJson.tags).toEqual(['e2etag', 'e2ePackage']);
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

        describe('test logger', () => {
            it('should run logger tests', async () => {
                const project = uniq('logger');
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project}`,
                );
                expect(await runTarget(project, targetOptions.test)).toContain('Successfully ran target test');
            });
        });
    });
});
