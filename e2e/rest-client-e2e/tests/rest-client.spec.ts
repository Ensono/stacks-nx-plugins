import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';
import { tmpProjPath } from '@nx/plugin/testing';
import {
    newProject,
    cleanup,
    runTarget,
    targetOptions,
} from '@ensono-stacks/e2e';
import YAML from 'yaml';
import fs from 'fs';

import petstoreSchemaJSON from '../fixtures/petstore-3.0.json';

describe('rest-client e2e', () => {
    jest.setTimeout(1_000_000);

    beforeAll(async () => {
        await newProject(['@ensono-stacks/rest-client'], ['@nx/js']);
    });

    afterAll(async () => {
        cleanup();
    });

    describe('http-client', () => {
        const project = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${project} --directory=libs/${project}`,
            );
        });

        it('should create src in the specified directory', async () => {
            expect(() =>
                checkFilesExist(
                    `libs/${project}/src/index.ts`,
                    `libs/${project}/src/index.test.ts`,
                ),
            ).not.toThrow();
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(`${project}`, targetOptions.test);

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('client-endpoint', () => {
        const libName = uniq('test-endpoint');
        const endpointsDir = uniq('endpoints');
        const httpclientName = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${httpclientName} --directory=libs/${httpclientName}`,
            );
        });

        it('should create lib in the specified directory', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${libName} --methods=get,post,patch,put,delete,head,options --folderPath=libs/${endpointsDir} --httpClient="@proj/${httpclientName}" --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `libs/${endpointsDir}/${libName}/v1/src/index.ts`,
                    `libs/${endpointsDir}/${libName}/v1/src/index.test.ts`,
                    `libs/${endpointsDir}/${libName}/v1/src/index.types.ts`,
                    `libs/${endpointsDir}/${libName}/v1/project.json`,
                    `libs/${endpointsDir}/${libName}/v1/tsconfig.json`,
                    `.env.local`,
                ),
            ).not.toThrow();

            const expectedImportName = `@proj/${libName}-v1`;

            const tsConfig = readJson('tsconfig.base.json');

            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`libs/${endpointsDir}/${libName}/v1/src/index.ts`],
            );
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDir}-v1-${libName}`,
                targetOptions.test,
            );

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    // Will be re-enabled once this bug is fixed https://amido-dev.visualstudio.com/Amido-Stacks/_backlogs/backlog/Cycle%2014%20-%20Frontend/Epics/?workitem=7375
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
            );
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDir}-v3-${libName}`,
                targetOptions.test,
            );

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('openapi-client', () => {
        const client = uniq('petstore');

        beforeAll(async () => {
            const tempPath = tmpProjPath();
            // Create schema file in the filesystem
            fs.writeFileSync(
                `${tempPath}/petstore-3.0.yaml`,
                YAML.stringify(petstoreSchemaJSON),
            );

            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:openapi-client ${client} --directory=libs/${client} --schema=petstore-3.0.yaml --zod --no-interactive --verbose`,
            );
        });

        it('should create the orval client with zod validation', async () => {
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
        });
    });
});
