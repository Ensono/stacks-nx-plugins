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
        await newProject(['@ensono-stacks/logger']);
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
                    `${project}/src/index.ts`,
                    `${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
            const projectJson = readJson(`${project}/project.json`);
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
                        `subdir/${project}/src/index.ts`,
                        `subdir/${project}/src/index.test.ts`,
                    ),
                ).not.toThrow();
            });
        });

        describe('test logger commands', () => {
            const project = uniq('logger');
            beforeAll(async () => {
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project}`,
                );
            });

            it('should run build', async () => {
                expect(await runTarget(project, targetOptions.build)).toContain('Successfully ran target build for project');
            });
            it('should run logger tests', async () => {
                expect(await runTarget(project, targetOptions.test)).toContain('Successfully ran target test');
            });
        });
    });
});
