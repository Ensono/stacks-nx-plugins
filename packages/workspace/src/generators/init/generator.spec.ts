import { Tree, readJson, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { InstallGeneratorSchema } from './schema';

describe('Workspace: Install generator', () => {
    let tree: Tree;
    const options: InstallGeneratorSchema = {
        pipelineRunner: 'none',
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

        it('should merge defaults with an existing eslintrc file', async () => {
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
                            extends: ['airbnb/base'],
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
        it('should install and configure husky and lint-staged', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: true,
            });

            const preCommit = tree.read('.husky/pre-commit');

            expect(preCommit?.toString()).toEqual(
                expect.stringContaining('npx lint-staged'),
            );
            expect(tree.exists('lint-staged.config.js')).toBeTruthy();

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
                expect.stringContaining(`npx do-something\nnpx lint-staged`),
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

    describe('--pipelineRunner', () => {
        it('should generate with a taskctl pipeline', async () => {
            updateJson(tree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    business: {
                        company: 'Ensono',
                        domain: 'Stacks',
                        component: 'Test',
                    },
                    cloud: { platform: 'azure', region: 'euw' },
                    domain: { external: 'ensono.com' },
                    pipeline: 'azdo',
                    vcs: {
                        type: 'github',
                    },
                },
            }));
            await generator(tree, {
                pipelineRunner: 'taskctl',
                eslint: false,
                commitizen: false,
                husky: false,
            });

            expect(tree.exists('build/taskctl')).toBeTruthy();
            expect(tree.exists('build/azDevOps')).toBeTruthy();
        });
    });
});
