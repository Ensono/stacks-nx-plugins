import {
    newProject,
    runTarget,
    targetOptions,
    cleanup,
} from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';

describe('logger e2e', () => {
    beforeAll(async () => {
        // await new Promise(resolve => setTimeout(resolve, 900000));
        await newProject(['@ensono-stacks/logger']);
    });

    afterAll(async () => {
        cleanup();
    });

    describe('winston generator', () => {
        it('should create logger and with all cli arguments', async () => {
            const project = uniq('logger');
            await runNxCommandAsync(
                `generate @ensono-stacks/logger:winston ${project} --directory=libs/${project} --tags e2etag,e2ePackage --logLevelType npm --consoleLog --fileTransportPath=/logs/log.log --httpTransportHost=localhost --httpTransportPort=3000 --httpTransportPath=somePath --httpTransportSSL --streamPath=/somePath`,
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

        describe('test logger commands', () => {
            const project = uniq('logger');
            beforeAll(async () => {
                await runNxCommandAsync(
                    `generate @ensono-stacks/logger:winston ${project} --directory=${project}`,
                );
            });

            it('should run build', async () => {
                expect(await runTarget(project, targetOptions.build)).toContain(
                    'Successfully ran target build for project',
                );
            });
            it('should run logger tests', async () => {
                expect(await runTarget(project, targetOptions.test)).toContain(
                    'Successfully ran target test',
                );
            });
        });
    });
});
