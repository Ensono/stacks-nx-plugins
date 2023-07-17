import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';
import { tmpProjPath } from '@nx/plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';
import YAML from 'yaml';
import fs from 'fs';

import petstoreSchemaJSON from '../fixtures/petstore-3.0.json';

describe('rest-client e2e', () => {
    beforeAll(async () => {
        await newProject('@ensono-stacks/rest-client', ['@nx/js']);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
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
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`libs/endpoints/${endpoint}/v1/src/index.ts`],
            );
        }, 120000);

        it('should run the generated tests without failure', async () => {
            const result = await runNxCommandAsync(
                `test endpoints-${endpoint}-v1`,
            );

            expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('bump-version', () => {
        const endpoint = uniq('test-endpoint');
        const endpointWithDirectory = `endpoints/${endpoint}`;

        beforeAll(async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --httpClient="@proj/http-client" --no-interactive`,
            );
        });

        it('should copy the existing endpoint and bump the version', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:bump-version --name endpoints-${endpoint}-v1 --endpointVersion=3 --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `libs/${endpointWithDirectory}/v1/src/index.ts`,
                    `libs/${endpointWithDirectory}/v1/src/index.test.ts`,
                    `libs/${endpointWithDirectory}/v1/src/index.types.ts`,
                    `libs/${endpointWithDirectory}/v1/project.json`,
                    `libs/${endpointWithDirectory}/v1/tsconfig.json`,
                ),
            ).not.toThrow();

            expect(() =>
                checkFilesExist(
                    `libs/${endpointWithDirectory}/v3/src/index.ts`,
                    `libs/${endpointWithDirectory}/v3/src/index.test.ts`,
                    `libs/${endpointWithDirectory}/v3/src/index.types.ts`,
                    `libs/${endpointWithDirectory}/v3/project.json`,
                    `libs/${endpointWithDirectory}/v3/tsconfig.json`,
                ),
            ).not.toThrow();

            const expectedImportNameV1 = `@proj/${endpointWithDirectory}/v1`;
            const expectedImportNameV3 = `@proj/${endpointWithDirectory}/v3`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV1,
                [`libs/${endpointWithDirectory}/v1/src/index.ts`],
            );
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV3,
                [`libs/${endpointWithDirectory}/v3/src/index.ts`],
            );
        }, 120000);

        it('should run the generated tests without failure', async () => {
            const result = await runNxCommandAsync(
                `test endpoints-${endpoint}-v3`,
            );

            expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('openapi-client', () => {
        const client = uniq('petstore');

        it('should create the orval client with zod validation', async () => {
            const tempPath = tmpProjPath();
            // Create schema file in the filesystem
            fs.writeFileSync(
                `${tempPath}/petstore-3.0.yaml`,
                YAML.stringify(petstoreSchemaJSON),
            );

            await runNxCommand(
                `generate @ensono-stacks/rest-client:openapi-client ${client} --schema=petstore-3.0.yaml --zod --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `libs/${client}/orval.config.js`,
                    `libs/${client}/orval.zod.config.js`,
                    `libs/${client}/petstore-3.0.yaml`,
                    `libs/${client}/src/index.ts`,
                    `libs/${client}/src/${client}.ts`,
                    `libs/${client}/src/${client}.msw.ts`,
                    `libs/${client}/src/${client}.zod.ts`,
                ),
            ).not.toThrow();

            const expectedImportName = `@proj/${client}`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`libs/${client}/src/index.ts`],
            );
        }, 120000);
    });
});
