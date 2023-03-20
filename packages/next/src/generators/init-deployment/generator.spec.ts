import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

describe('next deployment generator', () => {
    let tree: Tree;
    const options: NextGeneratorSchema = { project: 'next-app' };

    async function createNextApp(
        schema?: Partial<NextSchema>,
        skipStacksConfig = false,
    ) {
        tree = createTreeWithEmptyWorkspace();
        await applicationGenerator(tree, {
            name: 'next-app',
            style: 'css',
            ...schema,
        });

        if (!skipStacksConfig) {
            updateJson(tree, 'nx.json', nxJson => ({
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
        }
    }

    describe('infrastructure', () => {
        it('should throw if project is not defined', async () => {
            await createNextApp();
            await expect(
                generator(tree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrowError("Cannot find configuration for 'unknown'");
        });

        it('should not apply if stacks config is missing', async () => {
            await createNextApp({}, true);
            await generator(tree, { ...options });

            expect(tree.exists('next-app/Dockerfile')).not.toBeTruthy();
            expect(
                tree.exists('next-app/build/helm/Chart.yaml'),
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

        it('should scaffold with infrastructure', async () => {
            await createNextApp();
            tree.write('.prettierignore', '');
            await generator(tree, { ...options });

            expect(tree.exists('next-app/Dockerfile')).toBeTruthy();
            expect(tree.exists('next-app/build/helm/Chart.yaml')).toBeTruthy();
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
                'CMD ["dumb-init", "node_modules/.bin/next", "start"]',
            );

            const prettierIgnoreFile = tree.read('/.prettierignore', 'utf-8');
            expect(prettierIgnoreFile).toContain(
                'next-app/build/helm/**/*.yaml',
            );
        });

        it('should scaffold with infrastructure on a custom server', async () => {
            await createNextApp({ customServer: true });
            await generator(tree, { ...options });

            expect(tree.exists('next-app/Dockerfile')).toBeTruthy();
            expect(tree.exists('next-app/build/helm/Chart.yaml')).toBeTruthy();
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

        it('should update nx.json and tag executed generator true', async () => {
            await createNextApp({}, false);
            await generator(tree, { ...options });

            const nxJson = readJson(tree, 'nx.json');

            expect(
                nxJson.stacks.generatorsExecuted.NextInitDeployment,
            ).toBeTruthy();
            expect(nxJson.stacks.generatorsExecuted.NextInitDeployment).toBe(
                true,
            );
        });

        it('should return false from method and exit generator if already executed', async () => {
            await createNextApp({}, false);

            updateJson(tree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    generatorsExecuted: {
                        NextInitDeployment: true,
                    },
                },
            }));

            const gen = await generator(tree, {
                ...options,
            });

            expect(gen).toBe(false);
        });

        describe('--openTelemetry', () => {
            it('should add auto-instrumentation for OpenTelemetry if true', async () => {
                await createNextApp();
                tree.write('.prettierignore', '');
                await generator(tree, { ...options, openTelemetry: true });

                expect(
                    tree.exists('next-app/build/helm/values.yaml'),
                ).toBeTruthy();
                expect(
                    tree.exists('next-app/deploy/helm/nonprod/values.yaml'),
                ).toBeTruthy();
                expect(
                    tree.exists('next-app/deploy/helm/prod/values.yaml'),
                ).toBeTruthy();

                const defaultHelmValues = tree.read(
                    'next-app/build/helm/values.yaml',
                    'utf-8',
                );
                expect(defaultHelmValues).toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'true'",
                );
            });
        });
    });
});
