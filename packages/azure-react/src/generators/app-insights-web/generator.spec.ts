import { tsMorphTree } from '@ensono-stacks/core';
import { Tree, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { AppInsightsWebGeneratorSchema } from './schema';

describe('azure-react generator', () => {
    let tree: Tree;
    const projectName = 'app-insights-web';
    const options: AppInsightsWebGeneratorSchema = {
        name: projectName,
        connectionString: 'testConnectionString',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the app insights web library', async () => {
        await generator(tree, {
            ...options,
        });

        const config = readProjectConfiguration(tree, projectName);
        expect(config).toBeDefined();

        expect(tree.exists(`${projectName}/src/index.ts`)).toBeTruthy();
        expect(
            tree.exists(`${projectName}/src/app-insights-config.ts`),
        ).toBeTruthy();
        expect(
            tree.exists(`${projectName}/src/telemetry-provider.tsx`),
        ).toBeTruthy();

        const morphTree = tsMorphTree(tree);
        const telemetryProvider = morphTree.addSourceFileAtPath(
            `${projectName}/src/telemetry-provider.tsx`,
        );

        expect(
            telemetryProvider
                .getVariableDeclaration('connectionString')
                .getText(),
        ).toContain('process.env.TEST_CONNECTION_STRING');
    });

    it('should install dependencies', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining([
                '@microsoft/applicationinsights-web',
                '@microsoft/applicationinsights-react-js',
            ]),
        );
    });
});
