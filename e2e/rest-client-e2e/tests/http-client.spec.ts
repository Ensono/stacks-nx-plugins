import {
    checkFilesExist,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';

describe('http-client e2e', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/rest-client']);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    describe('http-client', () => {
        const project = uniq('rest-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${project}`,
            );
        })

        it('should create src in the specified directory', async () => {
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
        }, 120000);

        it('should run the generated tests without failure', async () => {
            const result = await runNxCommandAsync(
                `test ${project}`,
            );

            expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
        });
    });
});
