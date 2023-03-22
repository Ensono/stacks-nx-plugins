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
        updateJson(appTree, 'next-app/project.json', projectJson => ({
            ...projectJson,
            targets: {
                'helm-upgrade': {
                    executor: 'nx:run-commands',
                    options: {
                        commands: [
                            {
                                command:
                                    'helm upgrade --create-namespace --install next-app next-app -n nx --atomic --wait',
                                forwardAllArgs: false,
                            },
                        ],
                        cwd: 'apps/next-app/deploy/helm/nonprod',
                    },
                },
            },
        }));
    });

    it('should update project.json with environment variable', async () => {
        await generator(appTree, options);

        const projectFile = appTree.read('next-app/project.json');
        expect(projectFile.toString()).toContain(
            'env.APPLICATIONINSIGHTS_CONNECTIONS_STRING=$APPLICATIONINSIGHTS_CONNECTIONS_STRING',
        );
    });
});
