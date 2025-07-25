import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    {
        ignores: ['./src/generators/**/files/**'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        languageOptions: {
            parserOptions: {
                project: ['packages/workspace/tsconfig.*?.json'],
            },
        },
    },
];
