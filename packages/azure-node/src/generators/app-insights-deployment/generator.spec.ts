import { Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import generator from './generator';
import { AppInsightsDeploymentGeneratorSchema } from './schema';

describe('app-insights-deployment generator', () => {
    let appTree: Tree;
    const options: AppInsightsDeploymentGeneratorSchema = {
        project: 'next-app',
        applicationinsightsConnectionString:
            'APPLICATIONINSIGHTS_CONNECTIONS_STRING',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
        });
        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                business: {
                    company: 'Amido',
                    domain: 'stacks',
                    component: 'nx',
                },
                domain: {
                    internal: 'test.com',
                    external: 'test.dev',
                },
                cloud: {
                    region: 'euw',
                    platform: 'azure',
                },
                pipeline: 'azdo',
                terraform: {
                    group: 'terraform-group',
                    storage: 'terraform-storage',
                    container: 'terraform-container',
                },
                vcs: {
                    type: 'github',
                    url: 'remote.git',
                },
            },
        }));
    });

    it('should generate redis helm deploy values', async () => {
        await generator(appTree, options);

        expect(
            appTree.exists('next-app/deploy/helm/nonprod/appinsights.yaml'),
        ).toBeTruthy();
        expect(
            appTree.exists('next-app/deploy/helm/prod/appinsights.yaml'),
        ).toBeTruthy();

        const helmRedisValues = appTree.read(
            'next-app/deploy/helm/nonprod/appinsights.yaml',
        );
        expect(helmRedisValues.toString()).toContain(
            'APPLICATIONINSIGHTS_CONNECTION_STRING',
        );
    });
});
