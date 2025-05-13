import { tsMorphTree } from '@ensono-stacks/core';
import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readProjectConfiguration, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { AppInsightsWebGeneratorSchema } from './schema';

describe('azure-react generator', () => {
    let tree: Tree;
    const projectName = 'app-insights-web';
    const options: AppInsightsWebGeneratorSchema = {
        name: projectName,
        applicationinsightsConnectionString: 'TEST_CONNECTION_STRING',
        directory: projectName,
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        addStacksAttributes(tree, options.name);
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

    it('should throw an error if connection string is empty', async () => {
        await expect(() =>
            generator(tree, {
                ...options,
                applicationinsightsConnectionString: '',
            }),
        ).rejects.toThrowError(
            'applicationinsightsConnectionString cannot be empty.',
        );
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(tree, options);
        });
        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(tree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[options.name].includes(
                    'AzureReactAppInsightsWeb',
                ),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(tree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
