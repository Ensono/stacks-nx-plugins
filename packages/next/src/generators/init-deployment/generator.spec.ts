import { addStacksAttributes, executeWorkspaceInit } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { Schema as NextSchema } from '@nx/next/src/generators/application/schema';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

describe('next deployment generator', () => {
    let tree: Tree;
    const options: NextGeneratorSchema = {
        project: 'next-app',
        libraryName: 'stacks-helm-chart',
    };

    async function createNextApp(
        schema?: Partial<NextSchema>,
        skipStacksConfig = false,
    ) {
        tree = createTreeWithEmptyWorkspace();
        await applicationGenerator(tree, {
            name: 'next-app',
            style: 'css',
            appDir: false,
            ...schema,
        });

        if (!skipStacksConfig) {
            addStacksAttributes(tree, options.project);
        }
    }

    describe('infrastructure', () => {
        it('should throw if project is not defined', async () => {
            await createNextApp({});
            await executeWorkspaceInit(tree);
            await expect(
                generator(tree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrowError("Cannot find configuration for 'unknown'");
        });

        it('should not apply if stacks config is missing', async () => {
            await createNextApp({}, true);
            await expect(
                generator(tree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrowError(
                'Stacks configuration is not set. Please update nx.json',
            );

            expect(tree.exists('next-app/Dockerfile')).not.toBeTruthy();
            expect(
                tree.exists('libs/stacks-helm-chart/build/helm/Chart.yaml'),
            ).not.toBeTruthy();
            expect(
                tree.exists('next-app/deploy/helm/nonprod/values.yaml'),
            ).not.toBeTruthy();
            expect(
                tree.exists('next-app/deploy/helm/prod/values.yaml'),
            ).not.toBeTruthy();
            expect(
                tree.exists('next-app/deploy/terraform/versions.tf'),
            ).not.toBeTruthy();
            expect(
                tree.exists('next-app/deploy/terraform/data.tf'),
            ).not.toBeTruthy();
        });

        describe('should scaffold with infrastructure', () => {
            beforeAll(async () => {
                await createNextApp();
                tree.write('.prettierignore', '');
                await executeWorkspaceInit(tree);
                await generator(tree, { ...options });
            });

            it('should create the helm chart', () => {
                const libraryPath = joinPathFragments(
                    'libs',
                    'stacks-helm-chart',
                );
                const helmPath = joinPathFragments(
                    libraryPath,
                    'build',
                    'helm',
                );
                const templatePath = joinPathFragments(helmPath, 'templates');

                expect(
                    tree.exists(joinPathFragments(libraryPath, 'project.json')),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(helmPath, '.helmignore')),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(helmPath, 'Chart.yaml')),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(helmPath, 'values.yaml')),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(helmPath, 'charts', '.gitkeep'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(templatePath, 'deployment.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(templatePath, 'hpa.yaml')),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(templatePath, 'ingress.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(templatePath, 'NOTES.txt')),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(templatePath, 'service.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(templatePath, 'serviceaccount.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(templatePath, '_helpers.tpl'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(
                            templatePath,
                            'tests',
                            'test-connection.yaml',
                        ),
                    ),
                ).toBeTruthy();
            });

            it('creates the deployment files', () => {
                const deployPath = joinPathFragments(
                    'next-app',
                    'deploy',
                );
                const helmPath = joinPathFragments(deployPath, 'helm');
                const terraformPath = joinPathFragments(
                    deployPath,
                    'terraform',
                );

                expect(
                    tree.exists(
                        joinPathFragments(helmPath, 'nonprod', 'values.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(helmPath, 'prod', 'values.yaml'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(terraformPath, '.terraform.lock.hcl'),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(joinPathFragments(terraformPath, 'data.tf')),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(
                            terraformPath,
                            'variables',
                            'nonprod',
                            'dns.tfvars',
                        ),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(
                            terraformPath,
                            'variables',
                            'prod',
                            'dns.tfvars',
                        ),
                    ),
                ).toBeTruthy();
                expect(
                    tree.exists(
                        joinPathFragments(terraformPath, 'versions.tf'),
                    ),
                ).toBeTruthy();
            });

            it('creates the application docker file', () => {
                const docker = tree
                    .read(joinPathFragments('next-app', 'Dockerfile'))
                    ?.toString();

                expect(docker).toContain(
                    'CMD ["dumb-init", "node_modules/.bin/next", "start"]',
                );

                const prettierIgnoreFile = tree.read(
                    '/.prettierignore',
                    'utf8',
                );
                expect(prettierIgnoreFile).toContain(
                    'libs/stacks-helm-chart/build/helm/**/*.yaml',
                );
            });
        });

        it('should scaffold with infrastructure on a custom server', async () => {
            await createNextApp({ customServer: true });
            await executeWorkspaceInit(tree);
            await generator(tree, { ...options });

            expect(tree.exists('next-app/Dockerfile')).toBeTruthy();
            expect(
                tree.exists('libs/stacks-helm-chart/build/helm/Chart.yaml'),
            ).toBeTruthy();
            expect(
                tree.exists('next-app/deploy/helm/nonprod/values.yaml'),
            ).toBeTruthy();
            expect(
                tree.exists('next-app/deploy/helm/prod/values.yaml'),
            ).toBeTruthy();
            expect(
                tree.exists('next-app/deploy/terraform/versions.tf'),
            ).toBeTruthy();
            expect(
                tree.exists('next-app/deploy/terraform/data.tf'),
            ).toBeTruthy();

            const docker = tree.read('next-app/Dockerfile')?.toString();

            expect(docker).toContain(
                'CMD ["dumb-init", "node", "server/main.js"]',
            );
        });

        describe('executedDependantGenerator', () => {
            it('returns false if no prerequisite present', async () => {
                const gen = await generator(tree, {
                    ...options,
                });

                expect(gen).toBe(false);
            });
        });

        describe('executedGenerators', () => {
            beforeEach(async () => {
                await createNextApp({});
                await executeWorkspaceInit(tree);
                await generator(tree, options);
            });

            it('should update nx.json and tag executed generator true', async () => {
                const nxJson = readJson(tree, 'nx.json');

                expect(
                    nxJson.stacks.executedGenerators.project[
                        options.project
                    ].includes('NextInitDeployment'),
                ).toBe(true);
            });

            it('should return false from method and exit generator if already executed', async () => {
                const gen = await generator(tree, {
                    ...options,
                });

                expect(gen).toBe(false);
            });
        });

        describe('--libraryName', () => {
            it('should name library based on user prompt', async () => {
                await createNextApp();
                tree.write('.prettierignore', '');
                await executeWorkspaceInit(tree);
                await generator(tree, {
                    ...options,
                    libraryName: 'test-lib-name',
                });
                const defaultValuesPath =
                    'libs/test-lib-name/build/helm/values.yaml';
                expect(tree.exists(defaultValuesPath)).toBeTruthy();
            });
        });
    });
});
