import { Tree, readJson, readNxJson, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

describe('next install generator', () => {
    let tree: Tree;
    const options: NextGeneratorSchema = { project: 'next-app', infra: false };

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
        await applicationGenerator(tree, {
            name: 'next-app',
            style: 'css',
            standaloneConfig: false,
        });

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

        // console.log(tree.read('nx.json').toString());
    });

    describe('eslint', () => {
        it('should install and configure react specific eslint', async () => {
            await generator(tree, options);

            const packageJson = readJson(tree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining(['eslint-plugin-testing-library']),
            );
        });

        it('should throw if project is not defined', async () => {
            await expect(
                generator(tree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrowError("Cannot find configuration for 'unknown'");
        });

        it('should merge defaults with an existing eslintrc.json file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
                overrides: [
                    {
                        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                        extends: ['airbnb/base'],
                        plugins: ['@nrwl/nx'],
                        rules: {
                            'dot-notation': 'off',
                        },
                    },
                ],
            };

            tree.write(
                'next-app/.eslintrc.json',
                JSON.stringify(defaultConfig),
            );

            await generator(tree, options);

            const rootConfig = readJson(tree, 'next-app/.eslintrc.json');

            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: ['@nrwl/nx'],
                    extends: expect.arrayContaining([
                        'plugin:@nrwl/nx/react-typescript',
                        'plugin:testing-library/react',
                        'plugin:@next/next/recommended',
                        'next/core-web-vitals',
                    ]),
                    overrides: expect.arrayContaining([
                        expect.objectContaining({
                            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                            rules: expect.objectContaining({
                                'testing-library/await-async-utils': 'error',
                                'testing-library/await-async-query': 'error',
                                'testing-library/no-wait-for-side-effects':
                                    'error',
                                'testing-library/no-manual-cleanup': 'error',
                                'testing-library/prefer-explicit-assert':
                                    'warn',
                                'testing-library/prefer-presence-queries':
                                    'warn',
                                'testing-library/prefer-wait-for': 'error',
                                'testing-library/prefer-user-event': 'warn',
                                'testing-library/no-debug': 'off',
                            }),
                        }),
                    ]),
                }),
            );
        });
    });

    describe('infrastructure', () => {
        it('should scaffold with infrastructure', async () => {
            await generator(tree, { ...options, infra: true });

            expect(tree.exists('apps/next-app/Dockerfile')).toBeTruthy();
            expect(
                tree.exists('apps/next-app/build/helm/Chart.yaml'),
            ).toBeTruthy();
            expect(
                tree.exists('apps/next-app/build/helm/values-prod.yaml'),
            ).toBeTruthy();
            expect(
                tree.exists('apps/next-app/build/terraform/main.tf'),
            ).toBeTruthy();
            expect(
                tree.exists('apps/next-app/build/terraform/variables.tf'),
            ).toBeTruthy();
        });
    });
});
