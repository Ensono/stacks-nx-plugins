import { addStacksAttributes, executeWorkspaceInit } from '@ensono-stacks/test';
import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';

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

        it('should scaffold with infrastructure', async () => {
            await createNextApp();
            tree.write('.prettierignore', '');
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
                'CMD ["dumb-init", "node_modules/.bin/next", "start"]',
            );

            const prettierIgnoreFile = tree.read('/.prettierignore', 'utf-8');
            expect(prettierIgnoreFile).toContain(
                'libs/stacks-helm-chart/build/helm/**/*.yaml',
            );
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

        describe('--openTelemetry', () => {
            it('should add auto-instrumentation for OpenTelemetry if true', async () => {
                await createNextApp();
                tree.write('.prettierignore', '');
                await executeWorkspaceInit(tree);
                await generator(tree, { ...options, openTelemetry: true });
                const defaultValuesPath =
                    'libs/stacks-helm-chart/build/helm/values.yaml';
                const nonProdValuesPath =
                    'next-app/deploy/helm/nonprod/values.yaml';
                const prodValuesPath = 'next-app/deploy/helm/prod/values.yaml';
                expect(tree.exists(defaultValuesPath)).toBeTruthy();
                expect(tree.exists(nonProdValuesPath)).toBeTruthy();
                expect(tree.exists(prodValuesPath)).toBeTruthy();
                expect(tree.read(defaultValuesPath, 'utf-8')).not.toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'true'",
                );
                expect(tree.read(nonProdValuesPath, 'utf-8')).toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'true'",
                );
                expect(tree.read(prodValuesPath, 'utf-8')).toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'true'",
                );
            });
        });

        describe('--openTelemetry omitted', () => {
            it('should not add auto-instrumentation for OpenTelemetry if false', async () => {
                await createNextApp();
                tree.write('.prettierignore', '');
                await executeWorkspaceInit(tree);
                await generator(tree, { ...options, openTelemetry: false });
                const defaultValuesPath =
                    'libs/stacks-helm-chart/build/helm/values.yaml';
                const nonProdValuesPath =
                    'next-app/deploy/helm/nonprod/values.yaml';
                const prodValuesPath = 'next-app/deploy/helm/prod/values.yaml';
                expect(tree.exists(defaultValuesPath)).toBeTruthy();
                expect(tree.exists(nonProdValuesPath)).toBeTruthy();
                expect(tree.exists(prodValuesPath)).toBeTruthy();
                expect(tree.read(defaultValuesPath, 'utf-8')).not.toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'false'",
                );
                expect(tree.read(nonProdValuesPath, 'utf-8')).toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'false'",
                );
                expect(tree.read(prodValuesPath, 'utf-8')).toContain(
                    "instrumentation.opentelemetry.io/inject-nodejs: 'false'",
                );
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
