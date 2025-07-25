import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        languageOptions: {
            parserOptions: {
                project: ['packages/next/tsconfig.*?.json'],
            },
        },
        ignores: ['./src/generators/**/files/**'],
    },
];
