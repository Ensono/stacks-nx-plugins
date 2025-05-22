import { newProject, cleanup, createNextApplication } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readFile,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';

describe('azure-node e2e', () => {
    let projectDirectory: string;

    beforeAll(async () => {
        try {
            execSync('npx @ensono-stacks/create-stacks-workspace@e2e', {
                stdio: 'inherit',
            });
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }

        projectDirectory = await newProject(
            'azure-node-project',
            ['@ensono-stacks/next', '@ensono-stacks/azure-node'],
            ['@nx/next'],
            { version: '0.0.0-e2e' },
        );
    });

    afterAll(async () => {
        cleanup(projectDirectory);
        // await runNxCommandAsync('reset');
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
        });
    });
});
