import { tsMorphTree } from '@ensono-stacks/core';
import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import { Tree, joinPathFragments, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { Schema as NextSchema } from '@nx/next/src/generators/application/schema';
import { checkFilesExist, readFile } from '@nx/plugin/testing';

import generator from './generator';
import { NextGeneratorSchema } from './schema';
import { REACT_AXE_CORE_VERSION } from '../../utils/constants';

function snapshotFiles(tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('next install generator', () => {
    let tree: Tree;
    const options: NextGeneratorSchema = { project: 'next-app' };

    async function createNextApp(schema?: Partial<NextSchema>) {
        tree = createTreeWithEmptyWorkspace();
        await applicationGenerator(tree, {
            name: 'next-app',
            style: 'css',
            appDir: false,
            ...schema,
        });

        addStacksAttributes(tree, options.project);
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
                            executor: '@nx/jest:jest',
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
                    executor: '@nx/jest:jest',
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

        describe('executedGenerators', () => {
            beforeEach(async () => {
                await createNextApp({});
                await generator(tree, options);
            });

            it('should update nx.json and tag executed generator true', async () => {
                const nxJson = readJson(tree, 'nx.json');

                expect(
                    nxJson.stacks.executedGenerators.project[
                        options.project
                    ].includes('NextInit'),
                ).toBe(true);
            });

            it('should return false from method and exit generator if already executed', async () => {
                const gen = await generator(tree, {
                    ...options,
                });

                expect(gen).toBe(false);
            });
            it('should match the snapshot for _app.tsx file', async () => {
                const underscoreAppFilePath = joinPathFragments(
                    options.project,
                    'pages',
                    '_app.tsx',
                );
                snapshotFiles(tree, [underscoreAppFilePath]);
            });
            it('should install the react-axe package', async () => {
                const packageJson = readJson(tree, 'package.json');
                expect(packageJson?.devDependencies).toMatchObject({
                    '@axe-core/react': REACT_AXE_CORE_VERSION,
                });
            });
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
            expect(tsconfig?.include).toContain('**/*.ts');
            expect(tsconfig?.include).toContain('**/*.tsx');
            expect(tsconfig?.include).toContain('**/*.js');
            expect(tsconfig?.include).toContain('**/*.jsx');
            expect(tsconfig?.include).toContain('next-env.d.ts');
            expect(tsconfig?.include).toContain('next.config.js');

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
                plugins: ['@nx'],
                overrides: [
                    {
                        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                        extends: ['airbnb/base'],
                        plugins: ['@nx'],
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
                    plugins: ['@nx'],
                    extends: expect.arrayContaining([
                        'plugin:@nx/react-typescript',
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

    describe('storybook', () => {
        beforeEach(async () => {
            await createNextApp();
        });

        it('should install storybook dependencies', async () => {
            await generator(tree, options);

            const packageJson = readJson(tree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining([
                    '@nx/storybook',
                    '@storybook/nextjs',
                    '@storybook/addon-links',
                    '@storybook/manager-api',
                    '@storybook/preview-api',
                    '@storybook/addon-a11y',
                    '@storybook/addon-actions',
                    '@storybook/addon-jest',
                    '@storybook/theming',
                ]),
            );
        });

        it('should generate storybook folder with main file', async () => {
            await generator(tree, options);

            expect(() =>
                checkFilesExistInTree(tree, `next-app/.storybook/main.js`),
            ).not.toThrow();
        });

        it('should generate storybook folder with preview config', async () => {
            await generator(tree, options);

            expect(() =>
                checkFilesExistInTree(tree, `next-app/.storybook/preview.js`),
            ).not.toThrow();
        });

        it('should generate storybook tsconfig file', async () => {
            await generator(tree, options);

            expect(() =>
                checkFilesExistInTree(tree, `next-app/tsconfig.storybook.json`),
            ).not.toThrow();
        });

        it('should modify project.json with storybook command', async () => {
            await generator(tree, options);

            const projectJson = readJson(tree, 'next-app/project.json');

            expect(projectJson).toEqual(
                expect.objectContaining({
                    storybook: {
                        executor: '@nx/storybook:storybook',
                        options: {
                            port: 4400,
                            configDir: 'apps/next-app/.storybook',
                        },
                        configurations: {
                            ci: {
                                quiet: true,
                            },
                        },
                    },
                }),
            );
        });

        it('should modify nx.json with storybook command', async () => {
            await generator(tree, options);

            const nxConfigJson = readJson(tree, 'nx.json');

            expect(nxConfigJson).toEqual(
                expect.objectContaining({
                    targetDefaults: {
                        'build-storybook': {
                            inputs: [
                                'default',
                                '^production',
                                '{projectRoot}/.storybook/**/*',
                                '{projectRoot}/tsconfig.storybook.json',
                            ],
                        },
                    },
                }),
            );
        });

        it('should modify tsconfig.json with storybook command', async () => {
            await generator(tree, options);

            const tsconfigJson = readJson(tree, 'next-app/tsconfig.json');

            expect(tsconfigJson).toEqual(
                expect.objectContaining({
                    exclude: [
                        'node_modules',
                        'jest.config.ts',
                        'src/**/*.spec.ts',
                        'src/**/*.test.ts',
                        '**/*.stories.ts',
                        '**/*.stories.js',
                    ],
                    references: [
                        {
                            path: './tsconfig.storybook.json',
                        },
                    ],
                }),
            );
        });

        it('should modify .eslintrc.json with storybook command', async () => {
            await generator(tree, options);

            const eslintConfigJson = readJson(tree, 'next-app/.eslintrc.json');

            expect(eslintConfigJson).toEqual(
                expect.objectContaining({
                    overrides: [
                        {
                            parserOptions: {
                                project: [
                                    'apps/demo/tsconfig(.*)?.json',
                                    'apps/demo/tsconfig.storybook.json',
                                ],
                            },
                        },
                    ],
                }),
            );
        });
    });
});
