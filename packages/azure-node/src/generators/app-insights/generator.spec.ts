import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator as nextGenerator } from '@nx/next/src/generators/application/application';

import generator from './generator';
import { AppInsightsGeneratorSchema } from './schema';
import * as appInisghtsTemplate from './templates/appInsights';

describe('app-insights generator', () => {
    let appTree: Tree;

    const options: AppInsightsGeneratorSchema = {
        project: 'test',
        server: 'server/main.ts',
        applicationinsightsConnectionString: 'TEST_CONNECTION_STRING_ENV',
    };

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
        appTree.write(
            'test/server.js',
            `function main() { 
                //custom-server
            }`,
        );
        addStacksAttributes(appTree, options.project);
    });

    it('should run successfully', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
            directory: 'test',
        });

        const initAppInsightsSpy = jest.spyOn(
            appInisghtsTemplate,
            'initAppInsights',
        );
        const configureAppInsightsSpy = jest.spyOn(
            appInisghtsTemplate,
            'configureAppInsights',
        );
        const startAppInsightsSpy = jest.spyOn(
            appInisghtsTemplate,
            'startAppInsights',
        );

        await generator(appTree, options);

        expect(initAppInsightsSpy).toHaveBeenCalledWith(
            'TEST_CONNECTION_STRING_ENV',
        );
        expect(configureAppInsightsSpy).toHaveBeenCalledWith('test');
        expect(startAppInsightsSpy).toHaveBeenCalled();
    });

    it('should throw an error when no application is found matching the project option', async () => {
        const incorrectOptions: AppInsightsGeneratorSchema = {
            project: 'unknown-project',
            server: 'server.js',
            applicationinsightsConnectionString: 'TEST_CONNECTION_STRING_ENV',
        };

        await expect(generator(appTree, incorrectOptions)).rejects.toThrow(
            `No application was found with the name 'unknown-project'`,
        );
    });

    it('should throw an error when custom server is missing', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
            directory: 'test',
        });

        appTree.delete('test/server/main.ts');
        await expect(generator(appTree, options)).rejects.toThrow(
            'No custom server found.',
        );
    });

    it('should throw an error if appinsights is already imported', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
            directory: 'test',
        });

        appTree.write(
            'test/server/main.ts',
            'import * as appInsights from "applicationinsights"',
        );
        await expect(generator(appTree, options)).rejects.toThrow(
            'AppInsights SDK is already in use.',
        );
    });

    it('should install applicationinsights as dependency', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
            directory: 'test',
        });

        await generator(appTree, options);

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['applicationinsights']),
        );
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await nextGenerator(appTree, {
                name: 'test',
                customServer: true,
                style: 'css',
                directory: 'test',
            });
            await generator(appTree, options);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('AzureNodeAppInsights'),
            ).toBe(true);
        });

        it('should update server/main.ts', async () => {
            await generator(appTree, options);
            const mainTs = appTree.read('test/server/main.ts');

            expect(mainTs.toString()).toMatchSnapshot();
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
