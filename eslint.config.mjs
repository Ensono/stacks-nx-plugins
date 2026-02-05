import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nxEslintPlugin from '@nx/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import jsoncParser from 'jsonc-eslint-parser';

export default tseslint.config(
    {
        ignores: ['**/dist', '**/out-tsc', '**/tmp', '**/.nx', '**/coverage'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintPluginPrettier,
    eslintConfigPrettier,
    {
        plugins: {
            '@nx': nxEslintPlugin,
            import: eslintPluginImport,
            security: eslintPluginSecurity,
            unicorn: eslintPluginUnicorn,
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: 'tsconfig.base.json',
                },
            },
        },
    },
    {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        ignores: ['**/eslint.config.mjs'],
        rules: {
            // Nx module boundaries
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

            // Import rules (airbnb equivalent)
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

            // Core ESLint rules
            'dot-notation': 'off',
            'no-console': 'off',
            'no-duplicate-imports': 'error',
            'no-irregular-whitespace': 'error',
            'no-shadow': 'off',
            'no-use-before-define': 'off',
            'no-restricted-exports': 'off',
            'no-extra-semi': 'off',

            // Padding rules for code style
            'padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },
                {
                    blankLine: 'always',
                    prev: 'function',
                    next: 'function',
                },
                {
                    blankLine: 'always',
                    prev: 'singleline-let',
                    next: '*',
                },
                {
                    blankLine: 'always',
                    prev: 'singleline-const',
                    next: '*',
                },
                {
                    blankLine: 'never',
                    prev: 'singleline-const',
                    next: 'singleline-let',
                },
                {
                    blankLine: 'never',
                    prev: 'singleline-const',
                    next: 'singleline-const',
                },
                {
                    blankLine: 'never',
                    prev: 'singleline-let',
                    next: 'singleline-const',
                },
                {
                    blankLine: 'never',
                    prev: 'singleline-let',
                    next: 'singleline-let',
                },
                {
                    blankLine: 'always',
                    prev: 'const',
                    next: 'expression',
                },
                {
                    blankLine: 'always',
                    prev: 'let',
                    next: 'expression',
                },
            ],

            // Security plugin rules
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-fs-filename': 'off',

            // Unicorn plugin rules
            'unicorn/no-array-reduce': 'off',
            'unicorn/no-null': 'off',
            'unicorn/prefer-module': 'off',
            'unicorn/filename-case': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/no-for-loop': 'off',
            'unicorn/prefer-node-protocol': 'off',
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
        },
    },
    // TypeScript-specific rules
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
    // JavaScript-specific rules
    {
        files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
        rules: {},
    },
    // Test files
    {
        files: [
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.spec.js',
            '**/*.spec.jsx',
        ],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
    // JSON files
    {
        files: ['**/*.json'],
        rules: {
            'unicorn/prevent-abbreviations': 'off',
        },
        languageOptions: {
            parser: jsoncParser,
        },
    },
);
