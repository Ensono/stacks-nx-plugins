import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readFile } from '@nx/plugin/testing';
import { vi } from 'vitest';

import generator from './generator';

// Mock getPackageManagerCommand to return pnpm commands
vi.mock('@nx/devkit', async importOriginal => {
    const actual = await importOriginal<typeof import('@nx/devkit')>();

    return {
        ...actual,
        getPackageManagerCommand: vi.fn(() => ({
            exec: 'pnpm exec',
            install: 'pnpm install',
            add: 'pnpm add',
            addDev: 'pnpm add -D',
            rm: 'pnpm remove',
            run: (script: string, args?: string) =>
                `pnpm run ${script}${args ? ` ${args}` : ''}`,
            list: 'pnpm list',
        })),
    };
});

describe('init generator', () => {
    let tree: Tree;
    const options = {};

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
        addStacksAttributes(tree, '');
        // Add pnpm-lock.yaml so getPackageManagerCommand() returns pnpm commands
        tree.write('pnpm-lock.yaml', 'lockfileVersion: 5.4');
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
                    '@nx/eslint-plugin',
                    '@eslint/js',
                    'typescript-eslint',
                    'eslint-config-prettier',
                    'eslint-import-resolver-typescript',
                    'eslint-plugin-compat',
                    'eslint-plugin-import',
                    'eslint-plugin-prettier',
                    'eslint-plugin-security',
                    'eslint-plugin-unicorn',
                    'eslint-plugin-no-unsanitized',
                    'eslint-plugin-jest',
                    'eslint-plugin-jest-dom',
                    'jsonc-eslint-parser',
                    'globals',
                ]),
            );
        });

        it('should create flat config file (eslint.config.mjs)', async () => {
            await generator(tree, {
                ...options,
                eslint: true,
                commitizen: false,
                husky: false,
            });

            expect(tree.exists('eslint.config.mjs')).toBeTruthy();

            const configContent = tree.read('eslint.config.mjs', 'utf-8');

            // Verify key elements of the flat config
            expect(configContent).toContain("import js from '@eslint/js'");
            expect(configContent).toContain(
                "import tseslint from 'typescript-eslint'",
            );
            expect(configContent).toContain(
                "import nxPlugin from '@nx/eslint-plugin'",
            );
            expect(configContent).toContain(
                "import importPlugin from 'eslint-plugin-import'",
            );
            expect(configContent).toContain(
                "import securityPlugin from 'eslint-plugin-security'",
            );
            expect(configContent).toContain(
                "import unicornPlugin from 'eslint-plugin-unicorn'",
            );
            expect(configContent).toContain('stacks/global-ignores');
            expect(configContent).toContain('stacks/nx-boundaries');
            expect(configContent).toContain('@nx/enforce-module-boundaries');
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
                expect.stringContaining('pnpm exec lint-staged'),
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
                expect.stringContaining(
                    `npx do-something\npnpm exec lint-staged`,
                ),
            );

            expect(tree.exists('.husky/commit-msg')).toBeFalsy();
        });

        it('should configure prepare-commit-msg and commit-msg for commitlint', async () => {
            await addStacksAttributes(tree, '');

            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: true,
                husky: true,
            });

            const commitMessage = tree.read('.husky/commit-msg');
            const prepareMessage = tree.read('.husky/prepare-commit-msg');

            expect(commitMessage?.toString()).toEqual(
                expect.stringContaining('pnpm exec commitlint --edit "$1"'),
            );

            expect(prepareMessage?.toString()).toEqual(
                expect.stringContaining(
                    'exec < /dev/tty && pnpm exec cz --hook || true',
                ),
            );
        });
    });

    describe('--nvm', () => {
        it('should install and create nvm file', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
                nvm: true,
            });

            const nvmFile = tree.read('.nvmrc');

            expect(nvmFile?.toString()).toEqual(
                expect.stringContaining('22.16.0'),
            );
            expect(tree.exists('.nvmrc')).toBeTruthy();
        });

        it('should update file if it exists', async () => {
            const preCommitHook = 'v16.4.0';

            tree.write('.nvmrc', preCommitHook);

            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
                nvm: true,
            });

            const nvmFile = tree.read('.nvmrc');

            expect(nvmFile?.toString()).toEqual(
                expect.stringContaining('22.16.0'),
            );
            expect(tree.exists('.nvmrc')).toBeTruthy();
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

    describe('README.md file', () => {
        it('should create README file', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
                nvm: false,
            });

            const readmeFile = tree.exists('README.md');

            expect(readmeFile).toBeTruthy();
        });

        it('should show the default text', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
                nvm: false,
            });

            const readmeFile = tree.read('README.md', 'utf8');

            expect(readmeFile).toContain('Ensono Stacks Workspace');
        });

        it('should not show the nx command', async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
                nvm: false,
            });

            const readmeFile = tree.read('README.md', 'utf8');

            expect(readmeFile).not.toContain('nx build');
        });
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(tree, {
                ...options,
                eslint: false,
                commitizen: false,
                husky: false,
            });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(tree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.workspace.includes(
                    'WorkspaceInit',
                ),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(tree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
