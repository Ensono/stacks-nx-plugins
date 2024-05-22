import { updateEslintConfig, mergeEslintConfigs } from '@ensono-stacks/core';
import { Tree, addDependenciesToPackageJson } from '@nx/devkit';
import { Linter } from 'eslint';

import {
    ESLINT_PLUGIN_TESTING_LIBRARY_VERSION,
    TYPESCRIPT_ESLINT_PLUGIN_VERSION,
    TYPESCRIPT_ESLINT_PARSER_VERSION,
} from './constants';

function stacksEslintConfig(projectRootPath: string): Linter.Config {
    return {
        extends: [
            'plugin:@nx/react-typescript',
            'plugin:testing-library/react',
            'plugin:@next/next/recommended',
            'next/core-web-vitals',
        ],
        ignorePatterns: ['!**/*', '.next/**/*'],
        overrides: [
            {
                excludedFiles: ['jest.config.ts'],
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                parserOptions: {
                    project: ['tsconfig(.*)?.json'],
                },
                rules: {
                    '@typescript-eslint/no-floating-promises': 'error',
                    'testing-library/await-async-utils': 'error',
                    'testing-library/await-async-queries': 'error',
                    'testing-library/no-wait-for-side-effects': 'error',
                    'testing-library/no-manual-cleanup': 'error',
                    'testing-library/prefer-explicit-assert': 'warn',
                    'testing-library/prefer-presence-queries': 'warn',
                    'testing-library/prefer-user-event': 'warn',
                    'testing-library/no-debug': 'off',
                },
            },
        ],
        env: {
            jest: true,
        },
    };
}

function addRules(tree: Tree, projectRootPath: string) {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(
            baseConfig,
            stacksEslintConfig(projectRootPath),
        );
    });
}

function addEslintDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            'eslint-plugin-testing-library':
                ESLINT_PLUGIN_TESTING_LIBRARY_VERSION || 'latest',
            '@typescript-eslint/eslint-plugin':
                TYPESCRIPT_ESLINT_PLUGIN_VERSION || 'latest',
            '@typescript-eslint/parser': TYPESCRIPT_ESLINT_PARSER_VERSION,
        },
    );
}

export function addEslint(tree: Tree, projectSourceRoot: string) {
    addRules(tree, projectSourceRoot);
    return addEslintDependencies(tree);
}
