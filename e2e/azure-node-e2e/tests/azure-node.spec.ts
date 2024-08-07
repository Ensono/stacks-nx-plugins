import { newProject, cleanup, createNextApplication } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readFile,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';

describe('azure-node e2e', () => {
    jest.setTimeout(300_000);

    beforeAll(async () => {
        await newProject(
            ['@ensono-stacks/next', '@ensono-stacks/azure-node'],
            ['@nx/next'],
        );
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('app-insights generator', () => {
        const project = uniq('nextjs');

        it('runs the install generator', async () => {
            // Generate next project
            await runNxCommandAsync(
                `generate @nx/next:application ${project} --custom-server`,
            );
            // Add appInsights to custom server
            await runNxCommandAsync(
                `generate @ensono-stacks/azure-node:app-insights --project=${project} --applicationinsightsConnectionString=TEST_CONNECTION_STRING_ENV --server=server/main.ts --no-interactive --verbose`,
            );

            expect(() =>
                checkFilesExist(`apps/${project}/server/main.ts`),
            ).not.toThrow();

            const fileContent = readFile(`apps/${project}/server/main.ts`);
            expect(fileContent).toMatch(/import \* as appInsights/g);
            expect(fileContent).toMatch(
                /setup\(process\.env\.TEST_CONNECTION_STRING_ENV\)/g,
            );
            expect(fileContent).toMatch(/cloudRole(.|\n)*\'nextjs\d*\'/g);
            expect(fileContent).toMatch(/appInsights\.start/g);
        }, 12000000);
    });
});
