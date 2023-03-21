import { testUpdateStacksConfig } from '@ensono-stacks/core';
import { Tree, readJson, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

describe('next install generator', () => {
    let tree: Tree;
    const options: NextGeneratorSchema = { project: 'next-app' };

    async function createNextApp(schema?: Partial<NextSchema>) {
        tree = createTreeWithEmptyWorkspace();
        await applicationGenerator(tree, {
            name: 'next-app',
            style: 'css',
            ...schema,
        });

        testUpdateStacksConfig(tree, options.project);
    }

    describe('Project config', () => {
        beforeEach(async () => {
            await createNextApp();
        });

        it('should add the ci config in the test command in the project.json', async () => {
            tree.write(
                'next-app/project.json',
                JSON.stringify({
                    targets: { test: {} },
                    name: 'next-app',
                    sourceRoot: '/next-app',
                }),
            );

            await generator(tree, options);

            const projectConfig = readJson(tree, 'next-app/project.json');

            expect(projectConfig.targets.test).toMatchObject(
                expect.objectContaining({
                    configurations: {
                        ci: {
                            ci: true,
                            collectCoverage: true,
                            coverageReporters: ['text', 'html'],
                            collectCoverageFrom: [
                                './**/*.{js,jsx,ts,tsx}',
                                './!**/.next/**',
                                './!**/*.d.ts',
                                './!**/*.config.*',
                                './!**/_app.*',
                            ],
                            codeCoverage: true,
                        },
                    },
                }),
            );
        });

        it('should update the ci config in the test command in the project.json if there is an existing custom test config', async () => {
            tree.write(
                'next-app/project.json',
                JSON.stringify({
                    targets: {
                        test: {
                            executor: '@nrwl/jest:jest',
                            outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
                            options: {
                                jestConfig: '/next-app/jest.config.ts',
                                passWithNoTests: true,
                            },
                            configurations: {
                                ci: {
                                    ci: true,
                                },
                            },
                        },
                    },
                    name: 'next-app',
                    sourceRoot: '/next-app',
                }),
            );

            await generator(tree, options);

            const projectConfig = readJson(tree, 'next-app/project.json');

            expect(projectConfig.targets.test).toMatchObject(
                expect.objectContaining({
                    executor: '@nrwl/jest:jest',
                    outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
                    options: {
                        jestConfig: '/next-app/jest.config.ts',
                        passWithNoTests: true,
                    },
                    configurations: {
                        ci: {
                            ci: true,
                            collectCoverage: true,
                            coverageReporters: ['text', 'html'],
                            collectCoverageFrom: [
                                './**/*.{js,jsx,ts,tsx}',
                                './!**/.next/**',
                                './!**/*.d.ts',
                                './!**/*.config.*',
                                './!**/_app.*',
                            ],
                            codeCoverage: true,
                        },
                    },
                }),
            );
        });

        it('should update nx.json and tag executed generator true', async () => {
            await createNextApp({});
            await generator(tree, { ...options });

            const nxJson = readJson(tree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('NextInit'),
            ).toBeTruthy();
            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('NextInit'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            await createNextApp({});

            updateJson(tree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    executedGenerators: {
                        project: {
                            [options.project]: ['NextInit'],
                        },
                    },
                },
            }));

            const gen = await generator(tree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });

    describe('eslint', () => {
        beforeEach(async () => {
            await createNextApp();
        });

        it('should install and configure react specific eslint', async () => {
            await generator(tree, options);

            const packageJson = readJson(tree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining([
                    'eslint-plugin-testing-library',
                    '@typescript-eslint/eslint-plugin',
                ]),
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

        it('should merge default files with an existing tsconfig file', async () => {
            const defaultConfig = {
                extends: '../../tsconfig.base.json',
                compilerOptions: {
                    jsx: 'preserve',
                    allowJs: true,
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    strict: false,
                    forceConsistentCasingInFileNames: true,
                    noEmit: true,
                    resolveJsonModule: true,
                    isolatedModules: true,
                    incremental: true,
                    types: ['jest', 'node'],
                },
                include: [
                    'src/**/*.ts',
                    'src/**/*.tsx',
                    'src/**/*.js',
                    'src/**/*.jsx',
                    'next-env.d.ts',
                ],
                exclude: ['node_modules', 'jest.config.ts'],
            };
            const defaultSpecConfig = {
                extends: './tsconfig.json',
                compilerOptions: {
                    outDir: '../../dist/out-tsc',
                    module: 'commonjs',
                    types: ['jest', 'node'],
                    jsx: 'react',
                },
                include: [
                    'jest.config.ts',
                    'src/**/*.test.ts',
                    'src/**/*.spec.ts',
                    'src/**/*.test.tsx',
                    'src/**/*.spec.tsx',
                    'src/**/*.test.js',
                    'src/**/*.spec.js',
                    'src/**/*.test.jsx',
                    'src/**/*.spec.jsx',
                    'src/**/*.d.ts',
                ],
            };

            tree.write('next-app/tsconfig.json', JSON.stringify(defaultConfig));
            tree.write(
                'next-app/tsconfig.spec.json',
                JSON.stringify(defaultSpecConfig),
            );

            await generator(tree, options);

            const tsconfig = readJson(tree, 'next-app/tsconfig.json');
            expect(tsconfig?.include).toContain('next.config.js');
            expect(tsconfig?.include).toContain('**/*.js');
            expect(tsconfig?.include).toContain('next-env.d.ts');

            const tsconfigSpec = readJson(tree, 'next-app/tsconfig.spec.json');
            expect(tsconfigSpec?.include).toContain('jest.config.ts');
            expect(tsconfigSpec?.include).toContain('**/*.spec.js');
        });

        it('should merge default files with an existing tsconfig file and a src folder', async () => {
            const defaultConfig = {
                extends: '../../tsconfig.base.json',
                compilerOptions: {
                    jsx: 'preserve',
                    allowJs: true,
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    strict: false,
                    forceConsistentCasingInFileNames: true,
                    noEmit: true,
                    resolveJsonModule: true,
                    isolatedModules: true,
                    incremental: true,
                    types: ['jest', 'node'],
                },
                include: [
                    'src/**/*.ts',
                    'src/**/*.tsx',
                    'src/**/*.js',
                    'src/**/*.jsx',
                    'next-env.d.ts',
                ],
                exclude: ['node_modules', 'jest.config.ts'],
            };

            tree.write('next-app/tsconfig.json', JSON.stringify(defaultConfig));
            tree.write(
                'next-app/tsconfig.spec.json',
                JSON.stringify(defaultConfig),
            );
            tree.write('next-app/src/data.json', '{}');

            await generator(tree, options);

            const tsconfig = readJson(tree, 'next-app/tsconfig.json');
            expect(tsconfig?.include).toContain('src/**/*.ts');
            expect(tsconfig?.include).toContain('src/**/*.tsx');
            expect(tsconfig?.include).toContain('src/**/*.js');
            expect(tsconfig?.include).toContain('src/**/*.jsx');
            expect(tsconfig?.include).toContain('next-env.d.ts');
            expect(tsconfig?.include).toContain('next.config.js');
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
                            excludedFiles: ['jest.config.ts'],
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
                            parserOptions: {
                                project: ['next-app/tsconfig(.*)?.json'],
                            },
                        }),
                    ]),
                }),
            );
        });
    });
});
