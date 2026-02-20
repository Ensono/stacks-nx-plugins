import {
    newProject,
    cleanup,
    runTarget,
    targetOptions,
} from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    readJson,
    runNxCommand,
    runNxCommandAsync,
    tmpProjPath,
    uniq,
} from '@nx/plugin/testing';
import fs from 'fs';
import YAML from 'yaml';

import petstoreSchemaJSON from '../fixtures/petstore-3.0.json';

describe('rest-client e2e', () => {
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
        const libraryName = uniq('test-endpoint');
        const endpointsDirectory = uniq('endpoints');
        const httpclientName = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${httpclientName} --directory=libs/${httpclientName}`,
            );
        });

        it('should create lib in the specified directory', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${libraryName} --methods=get,post,patch,put,delete,head,options --folderPath=libs/${endpointsDirectory} --httpClient="@proj/${httpclientName}" --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `libs/${endpointsDirectory}/${libraryName}/v1/src/index.ts`,
                    `libs/${endpointsDirectory}/${libraryName}/v1/src/index.test.ts`,
                    `libs/${endpointsDirectory}/${libraryName}/v1/src/index.types.ts`,
                    `libs/${endpointsDirectory}/${libraryName}/v1/project.json`,
                    `libs/${endpointsDirectory}/${libraryName}/v1/tsconfig.json`,
                    `.env.local`,
                ),
            ).not.toThrow();

            const expectedImportName = `@proj/${libraryName}-v1`;
            const tsConfig = readJson('tsconfig.base.json');

            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportName,
                [`libs/${endpointsDirectory}/${libraryName}/v1/src/index.ts`],
            );
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDirectory}-v1-${libraryName}`,
                targetOptions.test,
            );

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    // Will be re-enabled once this bug is fixed https://amido-dev.visualstudio.com/Amido-Stacks/_backlogs/backlog/Cycle%2014%20-%20Frontend/Epics/?workitem=7375
    describe.skip('bump-version', () => {
        const libraryName = uniq('test-endpoint');
        const endpointsDirectory = uniq('endpoints');
        const httpclientName = uniq('http-client');

        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/rest-client:http-client ${httpclientName}`,
            );

            await runNxCommand(
                `generate @ensono-stacks/rest-client:client-endpoint ${libraryName} --methods=get,post --directory=${endpointsDirectory} --httpClient="@proj/${httpclientName}" --no-interactive`,
            );
        });

        it('should copy the existing endpoint and bump the version', async () => {
            await runNxCommand(
                `generate @ensono-stacks/rest-client:bump-version --name ${libraryName} --directory=${endpointsDirectory} --endpointVersion=3 --no-interactive`,
            );

            expect(() =>
                checkFilesExist(
                    `${endpointsDirectory}/v1/${libraryName}/src/index.ts`,
                    `${endpointsDirectory}/v1/${libraryName}/src/index.test.ts`,
                    `${endpointsDirectory}/v1/${libraryName}/src/index.types.ts`,
                    `${endpointsDirectory}/v1/${libraryName}/project.json`,
                    `${endpointsDirectory}/v1/${libraryName}/tsconfig.json`,
                ),
            ).not.toThrow();

            expect(() =>
                checkFilesExist(
                    `${endpointsDirectory}/v3/${libraryName}/src/index.ts`,
                    `${endpointsDirectory}/v3/${libraryName}/src/index.test.ts`,
                    `${endpointsDirectory}/v3/${libraryName}/src/index.types.ts`,
                    `${endpointsDirectory}/v3/${libraryName}/project.json`,
                    `${endpointsDirectory}/v3/${libraryName}/tsconfig.json`,
                ),
            ).not.toThrow();

            const expectedImportNameV1 = `@proj/${endpointsDirectory}/v1/${libraryName}`;
            const expectedImportNameV3 = `@proj/${endpointsDirectory}/v3/${libraryName}`;
            const tsConfig = readJson('tsconfig.base.json');

            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV1,
                [`${endpointsDirectory}/v1/${libraryName}/src/index.ts`],
            );
            expect(tsConfig.compilerOptions.paths).toHaveProperty(
                expectedImportNameV3,
                [`${endpointsDirectory}/v3/${libraryName}/src/index.ts`],
            );
        });

        it('should build the new version library without failure', async () => {
            await runTarget(
                `${endpointsDirectory}-v3-${libraryName}`,
                targetOptions.build,
            );
        });

        it('should run the generated tests without failure', async () => {
            const result = await runTarget(
                `${endpointsDirectory}-v3-${libraryName}`,
                targetOptions.test,
            );

            expect(result).not.toEqual(expect.stringContaining('FAIL'));
        });
    });

    describe('openapi-client', () => {
        const client = uniq('petstore');

        beforeAll(async () => {
            const temporaryPath = tmpProjPath();

            // Create schema file in the filesystem
            fs.writeFileSync(
                `${temporaryPath}/petstore-3.0.yaml`,
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
