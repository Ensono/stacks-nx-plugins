import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator as nextGenerator } from '@nrwl/next/src/generators/application/application';

import * as appInisghtsTemplate from '../../../templates/appInsights';
import generator from './generator';
import { AppInsightsGeneratorSchema } from './schema';

describe('app-insights generator', () => {
    let appTree: Tree;
    const options: AppInsightsGeneratorSchema = {
        project: 'test',
        server: 'server.js',
        appInsightsKey: 'TEST_KEY',
    };

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();
        appTree.write(
            'test/server.js',
            `function main() { 
                //custom-server
            }`,
        );
    });

    it('should run successfully', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
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

        expect(initAppInsightsSpy).toHaveBeenCalledWith('TEST_KEY');
        expect(configureAppInsightsSpy).toHaveBeenCalledWith('test');
        expect(startAppInsightsSpy).toHaveBeenCalled();
    });

    it('should throw an error when no application is found matching the project option', async () => {
        const incorrectOptions: AppInsightsGeneratorSchema = {
            project: 'unknown-project',
            server: 'server.js',
            appInsightsKey: 'TEST_KEY',
        };
        await expect(generator(appTree, incorrectOptions)).rejects.toThrowError(
            `No application was found with the name 'unknown-project'`,
        );
    });

    it('should throw an error when custom server is missing', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
        });

        appTree.delete('test/server.js');
        await expect(generator(appTree, options)).rejects.toThrowError(
            'No custom server found.',
        );
    });

    it('should throw an error if appinsights is already imported', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
        });

        appTree.write(
            'test/server.js',
            'import * as appInsights from "applicationinsights"',
        );
        await expect(generator(appTree, options)).rejects.toThrowError(
            'AppInsights SDK is already in use.',
        );
    });

    it('should install applicationinsights as dependency', async () => {
        await nextGenerator(appTree, {
            name: 'test',
            customServer: true,
            style: 'css',
        });

        await generator(appTree, options);

        const packageJson = readJson(appTree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['applicationinsights']),
        );
    });
});
