import { tsMorphTree } from '@ensono-stacks/core';
import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import { Tree, joinPathFragments, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { Schema as NextSchema } from '@nx/next/src/generators/application/schema';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

function snapshotFiles(tree: Tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrow();
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
            directory: 'next-app',
            linter: 'eslint',
            unitTestRunner: 'jest',
            e2eTestRunner: 'none',
            ...schema,
        });

        addStacksAttributes(tree, options.project);
    }

    describe('Generator', () => {
        beforeAll(async () => {
            await createNextApp();
            await generator(tree, options);
        });

        describe('Project config', () => {
            it('should add the ci config in the test command in the project.json', async () => {
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
        });

        describe('Dependencies', () => {
            it('should match the snapshot for layout.tsx file', async () => {
                const underscoreAppFilePath = joinPathFragments(
                    options.project,
                    'src',
                    'app',
                    'layout.tsx',
                );

                snapshotFiles(tree, [underscoreAppFilePath]);
            });

            it('should install the react-axe package', async () => {
                const packageJson = readJson(tree, 'package.json');

                expect(packageJson?.devDependencies).toMatchObject({
                    '@axe-core/react': __versions__.axe_core$react,
                });
            });

            it('should install and configure react specific eslint', async () => {
                const packageJson = readJson(tree, 'package.json');

                expect(Object.keys(packageJson.devDependencies)).toEqual(
                    expect.arrayContaining([
                        'eslint-plugin-testing-library',
                        '@next/eslint-plugin-next',
                    ]),
                );
            });
        });

        describe('Readme', () => {
            it('should create README file', async () => {
                const readmeFile = tree.exists('next-app/README.md');

                expect(readmeFile).toBeTruthy();
            });

            it('should show the project name in readme file', async () => {
                const readmeFile = tree.read('next-app/README.md', 'utf8');

                expect(readmeFile).toContain('next-app');
            });

            it('should show the nx command', async () => {
                const readmeFile = tree.read('next-app/README.md', 'utf8');

                expect(readmeFile).toContain('nx build next-app');
            });
        });
    });

    describe('eslint', () => {
        beforeEach(async () => {
            await createNextApp();
        });

        it('should throw if project is not defined', async () => {
            await expect(
                generator(tree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrow("Cannot find configuration for 'unknown'");
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

            expect(tsconfig?.include).toContain('src/**/*.ts');
            expect(tsconfig?.include).toContain('src/**/*.tsx');
            expect(tsconfig?.include).toContain('src/**/*.js');
            expect(tsconfig?.include).toContain('src/**/*.jsx');
            expect(tsconfig?.include).toContain('next-env.d.ts');

            const tsconfigSpec = readJson(tree, 'next-app/tsconfig.spec.json');

            expect(tsconfigSpec?.include).toContain('jest.config.ts');
            expect(tsconfigSpec?.include).toContain('src/**/*.spec.js');
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
        });

        it('should create flat config file (eslint.config.mjs)', async () => {
            await generator(tree, options);

            expect(tree.exists('next-app/eslint.config.mjs')).toBeTruthy();

            const configContent = tree.read(
                'next-app/eslint.config.mjs',
                'utf-8',
            );

            // Verify key elements of the Next.js flat config
            expect(configContent).toMatch(
                /import baseConfig from ['"]\.\.\/.*eslint\.config\.mjs['"]/,
            );
            expect(configContent).toMatch(
                /import .* from ['"]@next\/eslint-plugin-next['"]/,
            );
            expect(configContent).toMatch(
                /import .* from ['"]eslint-plugin-testing-library['"]/,
            );
            expect(configContent).toContain('next/recommended');
            expect(configContent).toContain('next/testing-library');
            expect(configContent).toContain(
                'testing-library/await-async-utils',
            );
            expect(configContent).toContain(
                'testing-library/await-async-queries',
            );
            expect(configContent).toContain('unicorn/prefer-top-level-await');

            // Verify Next.js ignores
            expect(configContent).toContain('next-env.d.ts');
            expect(configContent).toContain('.next/**/*');

            // Verify config file overrides
            expect(configContent).toContain('next/config-overrides');
            expect(configContent).toContain('next.config.js');
        });
    });
});
