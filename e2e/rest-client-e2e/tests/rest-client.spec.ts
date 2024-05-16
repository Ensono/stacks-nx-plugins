import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';
import { tmpProjPath } from '@nx/plugin/testing';
import { newProject, cleanup, runTarget, targetOptions } from '@ensono-stacks/e2e';
import YAML from 'yaml';
import fs from 'fs';

import petstoreSchemaJSON from '../fixtures/petstore-3.0.json';

describe('rest-client e2e', () => {
    jest.setTimeout(1_000_000);

    beforeAll(async () => {
        await newProject(['@ensono-stacks/rest-client'], ['@nx/js']);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('http-client', () => {
        const project = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${project}`,
            );
        });

        it('should create src in the specified directory', async () => {
            expect(() =>
                checkFilesExist(
                    `${project}/src/index.ts`,
                    `${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${project}`,
                targetOptions.test,
            )

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('client-endpoint', () => {
        const libName = uniq('test-endpoint');
        const endpointsDir = uniq('endpoints');
        const httpclientName = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${httpclientName}`,
            );
        });

        it('should create lib in the specified directory', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${libName} --methods=get,post,patch,put,delete,head,options --directory=${endpointsDir} --httpClient="@proj/${httpclientName}" --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `${endpointsDir}/v1/${libName}/src/index.ts`,
                    `${endpointsDir}/v1/${libName}/src/index.test.ts`,
                    `${endpointsDir}/v1/${libName}/src/index.types.ts`,
                    `${endpointsDir}/v1/${libName}/project.json`,
                    `${endpointsDir}/v1/${libName}/tsconfig.json`,
                    `.env.local`
                ),
            ).not.toThrow();

            const expectedImportName = `@proj/${endpointsDir}/v1/${libName}`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`${endpointsDir}/v1/${libName}/src/index.ts`],
            );
        });

        it('should build the library without failure', async () => {
            await runTarget(
                `${endpointsDir}-v1-${libName}`,
                targetOptions.build,
            )
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDir}-v1-${libName}`,
                targetOptions.test,
            )

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    xdescribe('bump-version', () => {
        const libName = uniq('test-endpoint');
        const endpointsDir = uniq('endpoints');

        const httpclientName = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${httpclientName}`,
            );

            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${libName} --methods=get,post --directory=${endpointsDir} --httpClient="@proj/${httpclientName}" --no-interactive`,
            );
        });

        it('should copy the existing endpoint and bump the version', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:bump-version --name ${libName} --directory=${endpointsDir} --endpointVersion=3 --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `${endpointsDir}/v1/${libName}/src/index.ts`,
                    `${endpointsDir}/v1/${libName}/src/index.test.ts`,
                    `${endpointsDir}/v1/${libName}/src/index.types.ts`,
                    `${endpointsDir}/v1/${libName}/project.json`,
                    `${endpointsDir}/v1/${libName}/tsconfig.json`,
                ),
            ).not.toThrow();

            expect(() =>
                checkFilesExist(
                    `${endpointsDir}/v3/${libName}/src/index.ts`,
                    `${endpointsDir}/v3/${libName}/src/index.test.ts`,
                    `${endpointsDir}/v3/${libName}/src/index.types.ts`,
                    `${endpointsDir}/v3/${libName}/project.json`,
                    `${endpointsDir}/v3/${libName}/tsconfig.json`,
                ),
            ).not.toThrow();

            const expectedImportNameV1 = `@proj/${endpointsDir}/v1/${libName}`;
            const expectedImportNameV3 = `@proj/${endpointsDir}/v3/${libName}`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV1,
                [`${endpointsDir}/v1/${libName}/src/index.ts`],
            );
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV3,
                [`${endpointsDir}/v3/${libName}src/index.ts`],
            );
        });

        it('should build the new version library without failure', async () => {
            await runTarget(
                `${endpointsDir}-v3-${libName}`,
                targetOptions.build,
            )
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDir}-v3-${libName}`,
                targetOptions.test,
            )

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
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
                    `${client}/orval.config.js`,
                    `${client}/orval.zod.config.js`,
                    `${client}/petstore-3.0.yaml`,
                    `${client}/src/index.ts`,
                    `${client}/src/${client}.ts`,
                    `${client}/src/${client}.msw.ts`,
                    `${client}/src/${client}.zod.ts`,
                ),
            ).not.toThrow();

            const expectedImportName = `@proj/${client}`;

            const tsConfig = readJson('tsconfig.base.json');
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`${client}/src/index.ts`],
            );
        });
    });
});
