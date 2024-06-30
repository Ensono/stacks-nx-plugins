import { updateEslintConfig, mergeEslintConfigs } from '@ensono-stacks/core';
import {
    ProjectConfiguration,
    Tree,
    addDependenciesToPackageJson,
} from '@nx/devkit';
import { Linter } from 'eslint';

import {
    ESLINT_PLUGIN_TESTING_LIBRARY_VERSION,
    TYPESCRIPT_ESLINT_PLUGIN_VERSION,
    TYPESCRIPT_ESLINT_PARSER_VERSION,
} from './constants';

function stacksEslintConfig(): Linter.Config {
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
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
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
                    'unicorn/prefer-top-level-await': 'off',
                },
                parserOptions: {
                    project: ['tsconfig(.*)?.json'],
                },
            },
        ],
    };
}

function customServerEslintConfig(): Linter.Config {
    return {
        overrides: [
            {
                files: 'server/main.ts',
                rules: {
                    'unicorn/no-process-exit': 'off',
                },
            },
        ],
    };
}

function addRules(
    tree: Tree,
    projectRootPath: string,
    options: { isCustomServer: boolean },
) {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(
            baseConfig,
            stacksEslintConfig(),
            options.isCustomServer ? customServerEslintConfig() : {},
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

export function addEslint(tree: Tree, project: ProjectConfiguration) {
    const isCustomServer = Boolean(
        project.targets?.['build-custom-server'] &&
            project.targets?.['serve-custom-server'],
    );

    addRules(tree, project.root, { isCustomServer });
    return addEslintDependencies(tree);
}
