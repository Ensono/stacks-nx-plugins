import { tsMorphTree } from '@ensono-stacks/core';
import {
    addStacksAttributes,
    checkFilesExistInTree,
    executeWorkspaceInit,
} from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { Schema as NextSchema } from '@nx/next/src/generators/application/schema';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

function snapshotFiles(tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

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
            expect(() =>
                checkFilesExistInTree(
                    tree,
                    'next-app/Dockerfile',
                    'libs/stacks-helm-chart/build/helm/Chart.yaml',
                    'next-app/deploy/helm/nonprod/values.yaml',
                    'next-app/deploy/helm/prod/values.yaml',
                    'next-app/deploy/terraform/versions.tf',
                    'next-app/deploy/terraform/data.tf',
                ),
            ).toThrowErrorMatchingInlineSnapshot(`
                "The following files are not present within the tree:
                next-app/Dockerfile
                libs/stacks-helm-chart/build/helm/Chart.yaml
                next-app/deploy/helm/nonprod/values.yaml
                next-app/deploy/helm/prod/values.yaml
                next-app/deploy/terraform/versions.tf
                next-app/deploy/terraform/data.tf"
            `);
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

                snapshotFiles(tree, [
                    joinPathFragments(libraryPath, 'project.json'),
                    joinPathFragments(helmPath, '.helmignore'),
                    joinPathFragments(helmPath, 'Chart.yaml'),
                    joinPathFragments(helmPath, 'values.yaml'),
                    joinPathFragments(helmPath, 'charts', '.gitkeep'),
                    joinPathFragments(templatePath, 'deployment.yaml'),
                    joinPathFragments(templatePath, 'hpa.yaml'),
                    joinPathFragments(templatePath, 'ingress.yaml'),
                    joinPathFragments(templatePath, 'NOTES.txt'),
                    joinPathFragments(templatePath, 'service.yaml'),
                    joinPathFragments(templatePath, 'serviceaccount.yaml'),
                    joinPathFragments(templatePath, '_helpers.tpl'),
                    joinPathFragments(
                        templatePath,
                        'tests',
                        'test-connection.yaml',
                    ),
                ]);
            });

            it('creates the deployment files', () => {
                const deployPath = joinPathFragments('next-app', 'deploy');
                const helmPath = joinPathFragments(deployPath, 'helm');
                const terraformPath = joinPathFragments(
                    deployPath,
                    'terraform',
                );
                const deploymentFiles = [
                    joinPathFragments(helmPath, 'nonprod', 'values.yaml'),
                    joinPathFragments(helmPath, 'prod', 'values.yaml'),
                    joinPathFragments(terraformPath, '.terraform.lock.hcl'),
                    joinPathFragments(terraformPath, 'data.tf'),
                    joinPathFragments(
                        terraformPath,
                        'variables',
                        'nonprod',
                        'dns.tfvars',
                    ),
                    joinPathFragments(
                        terraformPath,
                        'variables',
                        'prod',
                        'dns.tfvars',
                    ),
                    joinPathFragments(terraformPath, 'versions.tf'),
                ];
                snapshotFiles(tree, deploymentFiles);
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

            snapshotFiles(tree, [
                'next-app/Dockerfile',
                'libs/stacks-helm-chart/build/helm/Chart.yaml',
                'next-app/deploy/helm/nonprod/values.yaml',
                'next-app/deploy/helm/prod/values.yaml',
                'next-app/deploy/terraform/versions.tf',
                'next-app/deploy/terraform/data.tf',
            ]);

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
