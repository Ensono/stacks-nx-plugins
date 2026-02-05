import baseConfig from '../../eslint.config.mjs';
import jsoncParser from 'jsonc-eslint-parser';

export default [
    {
        ignores: ['**/dist', '**/out-tsc'],
    },
    ...baseConfig,
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        // Override or add rules here
        rules: {},
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        // Override or add rules here
        rules: {},
    },
    {
        files: ['**/*.js', '**/*.jsx'],
        // Override or add rules here
        rules: {},
    },
    {
        files: ['./package.json', './generators.json', './executors.json'],
        rules: {
            '@nx/nx-plugin-checks': 'error',
            '@nx/dependency-checks': 'error',
        },
        languageOptions: {
            parser: jsoncParser,
        },
    },
];
