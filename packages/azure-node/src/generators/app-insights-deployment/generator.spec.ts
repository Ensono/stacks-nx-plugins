import { addStacksAttributes, executeWorkspaceInit } from '@ensono-stacks/test';
import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';

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
        addStacksAttributes(appTree, options.project);
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
        await executeWorkspaceInit(appTree);
        await generator(appTree, options);

        const projectFile = appTree.read('next-app/project.json');
        expect(projectFile.toString()).toContain(
            'env.APPLICATIONINSIGHTS_CONNECTIONS_STRING=$APPLICATIONINSIGHTS_CONNECTIONS_STRING',
        );
    });

    describe('executedDependantGenerator', () => {
        it('returns false if no prerequisite present', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await executeWorkspaceInit(appTree);
            await generator(appTree, options);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('AzureNodeAppInsightsDeployment'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
