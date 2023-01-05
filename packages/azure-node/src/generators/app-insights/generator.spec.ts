import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import * as appInisghtsTemplate from '../../../templates/appInsights';
import generator from './generator';
import { AppInsightsGeneratorSchema } from './schema';

jest.mock('@nrwl/devkit', () => ({
    ...jest.requireActual('@nrwl/devkit'),
    getProjects: () => ({
        get: jest.fn(() => ({
            name: 'test',
            sourceRoot: 'test',
        })),
    }),
}));

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

    it('should throw an error when custom server is missing', async () => {
        appTree.delete('test/server.js');
        await expect(generator(appTree, options)).rejects.toThrowError(
            'No custom server found.',
        );
    });

    it('should throw an error if appinsights is already imported', async () => {
        appTree.write(
            'test/server.js',
            'import * as appInsights from "applicationinsights"',
        );
        await expect(generator(appTree, options)).rejects.toThrowError(
            'AppInsights SDK is already in use.',
        );
    });

    it('should install applicationinsights as dependency', async () => {
        await generator(appTree, options);

        const packageJson = readJson(appTree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['applicationinsights']),
        );
    });
});
