import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readFile,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';


describe('azure-node e2e', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/azure-node'], ['@nrwl/next']);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    describe('app-insights', () => {
        const project = uniq('nextjs');

        it('runs the install generator', async () => {
            // Generate next project
            await runNxCommandAsync(
                `generate @nrwl/next:application ${project} --custom-server`
            )
            // Add appInsights to custom server
            await runNxCommandAsync(
                `generate @ensono-stacks/azure-node:app-insights --project=${project} --appInsightsKey=TEST_KEY --server=server/main.ts --no-interactive --verbose`
            );
    
            expect(() =>
                checkFilesExist(
                    `apps/${project}/server/main.ts`
                ),
            ).not.toThrow();
            
            const fileContent = readFile(`apps/${project}/server/main.ts`);
            expect(fileContent).toMatch(/import \* as appInsights/g);
            expect(fileContent).toMatch(/setup\(process\.env\.TEST_KEY\)/g);
            expect(fileContent).toMatch(/cloudRole(.|\n)*\'nextjs\d*\'/g);
            expect(fileContent).toMatch(/appInsights\.start/g);
        }, 120000);
    });
});
