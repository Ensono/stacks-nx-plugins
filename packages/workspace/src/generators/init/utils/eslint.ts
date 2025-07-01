import {
    getNpmScope,
    mergeEslintConfigs,
    updateEslintConfig,
} from '@ensono-stacks/core';
import {
    Tree,
    addDependenciesToPackageJson,
    GeneratorCallback,
    readJson,
} from '@nx/devkit';
import { Linter } from 'eslint';

import {
    ESLINT_CONFIG_AIRBNB_VERSION,
    ESLINT_CONFIG_PRETTIER_VERSION,
    ESLINT_IMPORT_RESOLVER_TS_VERSION,
    ESLINT_PLUGIN_COMPAT_VERSION,
    ESLINT_PLUGIN_IMPORT_VERSION,
    ESLINT_PLUGIN_JSX_A11Y_VERSION,
    ESLINT_PLUGIN_PRETTIER_VERSION,
    ESLINT_PLUGIN_SECURITY_VERSION,
    ESLINT_PLUGIN_UNICORN_VERSION,
    ESLINT_PLUGIN_VERSION,
    ESLINT_VERSION,
    ESLINT_PLUGIN_JEST,
    ESLINT_PLUGIN_JEST_DOM,
    ESLINT_PLUGIN_NO_UNSANITIZED,
    PRETTIER_VERSION,
} from './constants';

function stacksEslintConfig(tree: Tree): Linter.Config {
    return {
        root: true,
        ignorePatterns: ['**/*'],
        plugins: [
            '@typescript-eslint',
            '@nx',
            'import',
            'security',
            'jsx-a11y',
            'jest',
        ],
        parser: '@typescript-eslint/parser',
        extends: [
            'airbnb/base',
            'plugin:prettier/recommended',
            'plugin:unicorn/recommended',
            'plugin:compat/recommended',
            'plugin:import/recommended',
            'plugin:import/typescript',
            'plugin:security/recommended-legacy',
            'plugin:jsx-a11y/recommended',
            'plugin:jest/recommended',
            'plugin:jest-dom/recommended',
            'plugin:no-unsanitized/recommended-legacy',
        ],
        settings: {
            'import/resolver': {
                typescript: {
                    project: 'tsconfig.base.json',
                },
            },
        },
        overrides: [
            {
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                rules: {
                    '@nx/enforce-module-boundaries': [
                        'error',
                        {
                            enforceBuildableLibDependency: true,
                            allow: [],
                            depConstraints: [
                                {
                                    sourceTag: '*',
                                    onlyDependOnLibsWithTags: ['*'],
                                },
                            ],
                        },
                    ],
                    'import/order': [
                        'error',
                        {
                            groups: [
                                ['builtin', 'external'],
                                ['internal'],
                                ['parent', 'sibling', 'index'],
                            ],
                            pathGroups: [
                                {
                                    pattern: `@${getNpmScope(tree)}/**`,
                                    group: 'internal',
                                },
                            ],
                            alphabetize: {
                                order: 'asc',
                            },
                            'newlines-between': 'always',
                        },
                    ],
                    'import/no-extraneous-dependencies': 'off',
                    'import/prefer-default-export': 'off',
                    'import/extensions': [
                        'error',
                        'always',
                        {
                            ts: 'never',
                            tsx: 'never',
                            js: 'never',
                            jsx: 'never',
                        },
                    ],
                    'no-console': 'off',
                    'no-duplicate-imports': 'error',
                    'no-irregular-whitespace': 'error',
                    'no-shadow': 'off',
                    'no-use-before-define': 'off',
                    'no-restricted-exports': 'off',
                    'security/detect-object-injection': 'off',
                    'unicorn/no-array-reduce': 'off',
                    'unicorn/no-null': 'off',
                    'unicorn/prefer-module': 'off',
                    'unicorn/filename-case': 'off',
                    'unicorn/no-array-for-each': 'off',
                    'unicorn/no-for-loop': 'off',
                    'unicorn/prevent-abbreviations': [
                        'error',
                        {
                            allowList: {
                                getServerSideProps: true,
                                getStaticProps: true,
                            },
                            replacements: {
                                env: {
                                    environment: false,
                                },
                            },
                        },
                    ],
                    'jest/expect-expect': [
                        'error',
                        {
                            assertFunctionNames: [
                                'expect',
                                'cy.**.should',
                                '**.contains',
                            ],
                        },
                    ],
                },
            },
            {
                files: ['*.ts', '*.tsx'],
                extends: ['plugin:@nx/typescript'],
                rules: {
                    '@typescript-eslint/no-empty-function': 'off',
                    '@typescript-eslint/no-explicit-any': 'off',
                    '@typescript-eslint/ban-ts-comment': 'off',
                    '@typescript-eslint/no-unsafe-call': 'off',
                    '@typescript-eslint/no-unsafe-assignment': 'off',
                    '@typescript-eslint/no-unsafe-member-access': 'off',
                    '@typescript-eslint/explicit-function-return-type': 'off',
                    '@typescript-eslint/interface-name-prefix': 'off',
                    '@typescript-eslint/no-use-before-define': 'error',
                    '@typescript-eslint/no-unused-vars': 'off',
                    '@typescript-eslint/no-shadow': 'error',
                    'unicorn/prefer-node-protocol': 'off',
                },
            },
            {
                files: '*.json',
                parser: 'jsonc-eslint-parser',
                rules: {
                    'unicorn/prevent-abbreviations': 'off',
                },
            },
            {
                files: 'jest.config.ts',
                rules: {
                    'unicorn/no-abusive-eslint-disable': 'off',
                },
            },
        ],
    };
}

function addRules(tree: Tree) {
    updateEslintConfig(tree, '', baseConfig => {
        return mergeEslintConfigs(baseConfig, stacksEslintConfig(tree));
    });
}

function addEslintDependencies(tree: Tree) {
    const { devDependencies } = readJson(tree, 'package.json');
    const nxDependency =
        (devDependencies &&
            Object.entries(devDependencies)
                .find(([key]) => key.startsWith('@nx/'))
                ?.at(1)) ||
        'latest';

    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@nx/eslint-plugin': nxDependency,
            '@typescript-eslint/eslint-plugin': ESLINT_PLUGIN_VERSION,
            eslint: ESLINT_VERSION,
            'eslint-config-airbnb': ESLINT_CONFIG_AIRBNB_VERSION,
            'eslint-config-prettier': ESLINT_CONFIG_PRETTIER_VERSION,
            'eslint-import-resolver-typescript':
                ESLINT_IMPORT_RESOLVER_TS_VERSION,
            'eslint-plugin-compat': ESLINT_PLUGIN_COMPAT_VERSION,
            'eslint-plugin-jsx-a11y': ESLINT_PLUGIN_JSX_A11Y_VERSION,
            'eslint-plugin-import': ESLINT_PLUGIN_IMPORT_VERSION,
            'eslint-plugin-prettier': ESLINT_PLUGIN_PRETTIER_VERSION,
            'eslint-plugin-security': ESLINT_PLUGIN_SECURITY_VERSION,
            'eslint-plugin-unicorn': ESLINT_PLUGIN_UNICORN_VERSION,
            'eslint-plugin-jest': ESLINT_PLUGIN_JEST,
            'eslint-plugin-jest-dom': ESLINT_PLUGIN_JEST_DOM,
            'eslint-plugin-no-unsanitized': ESLINT_PLUGIN_NO_UNSANITIZED,
            prettier: PRETTIER_VERSION,
        },
    );
}

export function addEslint(tree: Tree): GeneratorCallback {
    addRules(tree);
    return addEslintDependencies(tree);
}
