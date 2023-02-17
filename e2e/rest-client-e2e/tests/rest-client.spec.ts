import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';

describe('rest-client e2e', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/rest-client'], ['@nrwl/js']);
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
        });

        it('should create src in the specified directory', async () => {
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
        }, 120000);

        it('should run the generated tests without failure', async () => {
            const result = await runNxCommandAsync(`test ${project}`);

            expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('client-endpoint', () => {
        const endpoint = uniq('test-endpoint');

        it('should create lib in the specified directory', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --httpClient="@proj/http-client" --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `libs/endpoints/${endpoint}/v1/src/index.ts`,
                    `libs/endpoints/${endpoint}/v1/src/index.test.ts`,
                    `libs/endpoints/${endpoint}/v1/src/index.types.ts`,
                    `libs/endpoints/${endpoint}/v1/project.json`,
                    `libs/endpoints/${endpoint}/v1/tsconfig.json`,
                ),
            ).not.toThrow();

            const expectedImportName = '@proj/api/customers/v1';

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(expectedImportName, 'libs/endpoints/${endpoint}/v1/src/index.ts');
        }, 120000);
    });

    describe('bump-version', () => {
        const endpoint = uniq('testEndpoint');

        beforeAll(() => {
            runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --endpointVersion=1 --no-interactive`,
            );
            runNxCommand(
                `generate @ensono-stacks/rest-client:bump-version --endpointPath=endpoints --endpoint=${endpoint} --endpointVersion=2 --no-interactive`,
            );
        });

        it('should copy the existing endpoint and bump the version', async () => {
            expect(() =>
                checkFilesExist(
                    `endpoints/${endpoint}/V1/index.ts`,
                    `endpoints/${endpoint}/V1/index.test.ts`,
                    `endpoints/${endpoint}/V1/index.types.ts`,
                ),
            ).not.toThrow();

            expect(() =>
                checkFilesExist(
                    `endpoints/${endpoint}/V2/index.ts`,
                    `endpoints/${endpoint}/V2/index.test.ts`,
                    `endpoints/${endpoint}/V2/index.types.ts`,
                ),
            ).not.toThrow();
        }, 120000);
    });
});
