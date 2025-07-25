import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nxEslintPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginSecurity from 'eslint-plugin-security';
// import globals from 'globals';

const compat = new FlatCompat({
    baseDirectory: dirname(fileURLToPath(import.meta.url)),
    recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
    {
        ignores: ['**/dist'],
    },
    eslintPluginUnicorn.configs.recommended,
    eslintPluginSecurity.configs.recommended,
    ...nxEslintPlugin.configs['flat/base'],
    ...nxEslintPlugin.configs['flat/typescript'],
    ...nxEslintPlugin.configs['flat/javascript'],
    {
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: [
                        'packages/*/tsconfig.json',
                        'packages/common/*/tsconfig.json',
                        'e2e/*/tsconfig.json',
                    ],
                },
            },
        },
    },
    {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        extends: [
            eslintPluginImport.flatConfigs.recommended,
            eslintPluginImport.flatConfigs.typescript,
        ],
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: [],
                    depConstraints: [
                        {
                            sourceTag: 'e2e',
                            onlyDependOnLibsWithTags: ['e2e'],
                        },
                        {
                            sourceTag: 'plugin',
                            onlyDependOnLibsWithTags: ['plugin'],
                        },
                    ],
                },
            ],
            'import/order': [
                'error',
                {
                    groups: [
                        ['builtin', 'external'],
                        ['parent', 'internal', 'sibling', 'index'],
                    ],
                    pathGroups: [
                        {
                            pattern: '@ensono-stacks/**',
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
            'dot-notation': 'off',
            'no-console': 'off',
            'no-duplicate-imports': 'error',
            'no-irregular-whitespace': 'error',
            'no-shadow': 'off',
            'no-use-before-define': 'off',
            'no-restricted-exports': 'off',
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-fs-filename': 'off',
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
                        args: true,
                    },
                    replacements: {
                        env: {
                            environment: false,
                        },
                        prod: {
                            production: false,
                        },
                    },
                    ignore: ['^e2e', 'e2e$'],
                },
            ],

            'unicorn/prefer-node-protocol': 'off',
            'no-extra-semi': 'off',
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
        rules: {
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/no-use-before-define': ['error'],
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-shadow': 'error',
        },
    },

    {
        files: ['**/*.json'],
        rules: {
            'unicorn/prevent-abbreviations': 'off',
        },
        languageOptions: {
            parser: await import('jsonc-eslint-parser'),
        },
    },
    eslintPluginPrettier,
);
