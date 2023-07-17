import { checkFilesExist, runNxCommandAsync, uniq } from '@nx/plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';

describe('azure-react e2e', () => {
    beforeAll(async () => {
        await newProject('@ensono-stacks/azure-react', ['@nrwl/react']);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('app-insights-web', () => {
        const project = uniq('app-insights');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/azure-react:app-insights-web ${project} --applicationinsightsConnectionString=TEST_CONNECTION_STRING_ENV --no-interactive`,
            );
        });

        it('should create src in the specified directory', async () => {
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/app-insights-config.ts`,
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/telemetry-provider.test.tsx`,
                    `libs/${project}/src/telemetry-provider.tsx`,
                ),
            ).not.toThrow();
        }, 120000);
    });
});
