import { checkFilesExist, runNxCommand, runNxCommandAsync, uniq } from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';

describe('http-client e2e', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/rest-client'], ['@nrwl/js']);
    });

    afterAll(() => {
        cleanup();
    });

    describe('client-endpoint', () => {
        const endpoint = uniq('testEndpoint');

        beforeAll(async () => {});

        it('should create src in the specified directory', () => {
            runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `endpoints/${endpoint}/V1/index.ts`,
                    `endpoints/${endpoint}/V1/index.test.ts`,
                    `endpoints/${endpoint}/V1/index.types.ts`,
                    `.env`,
                ),
            ).not.toThrow();
        }, 120000);
    });
});
