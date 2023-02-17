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

            const expectedImportName = `@proj/endpoints/${endpoint}/v1`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(expectedImportName, [`libs/endpoints/${endpoint}/v1/src/index.ts`]);
        }, 120000);
    });

    describe('bump-version', () => {
        const endpoint = uniq('test-endpoint');

        beforeAll(async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --httpClient="@proj/http-client" --no-interactive`,
            );
        });

        it('should copy the existing endpoint and bump the version', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:bump-version ${endpoint} --directory=endpoints --endpointVersion=3 --no-interactive`,
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

            expect(() =>
                checkFilesExist(
                    `libs/endpoints/${endpoint}/v3/src/index.ts`,
                    `libs/endpoints/${endpoint}/v3/src/index.test.ts`,
                    `libs/endpoints/${endpoint}/v3/src/index.types.ts`,
                    `libs/endpoints/${endpoint}/v3/project.json`,
                    `libs/endpoints/${endpoint}/v3/tsconfig.json`,
                ),
            ).not.toThrow();

            const expectedImportNameV1 = `@proj/endpoints/${endpoint}/v1`;
            const expectedImportNameV3 = `@proj/endpoints/${endpoint}/v3`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(expectedImportNameV1, [`libs/endpoints/${endpoint}/v1/src/index.ts`]);
            expect(tsConfig.compilerOptions.paths).toHaveProperty(expectedImportNameV3, [`libs/endpoints/${endpoint}/v3/src/index.ts`]);
        }, 120000);
    });
});
