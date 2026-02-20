import jsoncParser from 'jsonc-eslint-parser';
import baseConfig from '../../../eslint.config.mjs';

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
        files: ['./package.json'],
        rules: {
            '@nx/dependency-checks': 'error',
        },
        languageOptions: {
            parser: jsoncParser,
        },
    },
];
