import { readJsonInJS } from '@ensono-stacks/core';
import { Tree, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { InstallGeneratorSchema } from './schema';

describe('Workspace: Install generator', () => {
    let tree: Tree;
    const options: InstallGeneratorSchema = {
        cloudProvider: 'azure',
        pipelineProvider: 'azdo',
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('--eslint', () => {
        it('should install and configure eslint', async () => {
            await generator(tree, {
                ...options,
                eslint: true,
                commitizen: false,
                husky: false,
            });

            const packageJson = readJson(tree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining([
                    'eslint',
                    '@nrwl/eslint-plugin-nx',
                    'eslint-config-airbnb',
                    'eslint-config-prettier',
                    'eslint-import-resolver-typescript',
                    'eslint-plugin-compat',
                    'eslint-plugin-import',
                    'eslint-plugin-prettier',
                    'eslint-plugin-security',
                    'eslint-plugin-unicorn',
                ]),
            );
        });

        it('should merge defaults with an existing eslintrc.json file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
                overrides: [
                    {
                        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                        extends: ['airbnb-base'],
                        plugins: ['@nrwl/nx'],
                        rules: {
                            'dot-notation': 'off',
                        },
                    },
                ],
            };

            tree.write('.eslintrc.json', JSON.stringify(defaultConfig));

            await generator(tree, {
                ...options,
                eslint: true,
                commitizen: false,
                husky: false,
            });

            const rootConfig = readJson(tree, '.eslintrc.json');
            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: [
                        '@nrwl/nx',
                        '@typescript-eslint',
                        'import',
                        'security',
                    ],
                    overrides: expect.arrayContaining([
                        expect.objectContaining({
                            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                            extends: ['airbnb-base'],
                            plugins: ['@nrwl/nx'],
                            rules: expect.objectContaining({
                                'dot-notation': 'off',
                                'import/no-extraneous-dependencies': 'off',
                            }),
                        }),
                    ]),
                }),
            );
        });

        it('should merge defaults with an existing eslintrc.js file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
            };

            tree.write(
                '.eslintrc.js',
                `module.exports = ${JSON.stringify(defaultConfig)};`,
            );

            await generator(tree, { ...options, eslint: true });

            const rootConfig = readJsonInJS(
                tree,
                '.eslintrc.js',
                'BinaryExpression > ObjectLiteralExpression',
            );
            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: [
                        '@nrwl/nx',
                        '@typescript-eslint',
                        'import',
                        'security',
                    ],
                    overrides: expect.arrayContaining([
                        expect.objectContaining({
                            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                            rules: expect.objectContaining({
                                'import/no-extraneous-dependencies': 'off',
                            }),
                        }),
                    ]),
                }),
            );
        });
    });

    describe('--commitizen', () => {
        it('should install and configure commitizen', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: true,
                husky: false,
            });

            const packageJson = readJson(tree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining([
                    'commitizen',
                    '@commitlint/cz-commitlint',
                ]),
            );

            expect(packageJson).toMatchObject(
                expect.objectContaining({
                    config: {
                        commitizen: {
                            path: '@commitlint/cz-commitlint',
                        },
                    },
                }),
            );
        });

        it('should skip configuring commitizen if a config is found', async () => {
            const commitizenConfig = {
                path: 'some-path',
            };

            tree.write('.cz.json', JSON.stringify(commitizenConfig));

            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: true,
                husky: false,
            });

            const packageJson = readJson(tree, 'package.json');

            expect(readJson(tree, '.cz.json')).toMatchObject(commitizenConfig);
            expect(packageJson).not.toMatchObject(
                expect.objectContaining({
                    config: {
                        commitizen: {
                            path: '@commitlint/cz-commitlint',
                        },
                    },
                }),
            );
        });
    });

    describe('--husky', () => {
        it('should install and configure husky', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: true,
            });

            const preCommit = tree.read('.husky/pre-commit');

            expect(preCommit?.toString()).toEqual(
                expect.stringContaining('npx nx affected:lint --uncommitted'),
            );

            expect(tree.exists('.husky/commit-msg')).toBeFalsy();
        });

        it('should append to existing hooks', async () => {
            const preCommitHook = 'npx do-something';
            tree.write('.husky/pre-commit', preCommitHook);

            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: true,
            });

            const preCommit = tree.read('.husky/pre-commit');

            expect(preCommit?.toString()).toEqual(
                expect.stringContaining(
                    `npx do-something
npx nx affected:lint --uncommitted`,
                ),
            );

            expect(tree.exists('.husky/commit-msg')).toBeFalsy();
        });

        it('should configure prepare-commit-msg and commit-msg for commitlint', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: true,
                husky: true,
            });

            const commitMessage = tree.read('.husky/commit-msg');
            const prepareMessage = tree.read('.husky/prepare-commit-msg');

            expect(commitMessage?.toString()).toEqual(
                expect.stringContaining(
                    'npx --no-install commitlint --edit "$1"',
                ),
            );

            expect(prepareMessage?.toString()).toEqual(
                expect.stringContaining(
                    'exec < /dev/tty && npx cz --hook || true',
                ),
            );
        });
    });

    describe('tsconfig.base', () => {
        it('should generate the tsconfig.base file', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
            });

            expect(tree.exists('tsconfig.base.json')).toBeTruthy();
        });
    });
});
