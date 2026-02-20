import {
    mergeFlatConfigs,
    readFlatEslintConfig,
    writeFlatEslintConfig,
} from '@ensono-stacks/core';
import { Tree, addDependenciesToPackageJson } from '@nx/devkit';

import {
    ESLINT_PLUGIN_TESTING_LIBRARY_VERSION,
    TYPESCRIPT_ESLINT_PLUGIN_VERSION,
    TYPESCRIPT_ESLINT_PARSER_VERSION,
} from './version';

function generateTestingLibraryConfig(): string {
    return `
  // Testing Library rules
  {
    name: 'testing-library/react',
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['**/jest.config.ts'],
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
  
  // Jest config exclusions
  {
    name: 'jest-config-overrides',
    files: ['**/jest.config.ts'],
    rules: {
      'unicorn/no-abusive-eslint-disable': 'off',
    },
  },`;
}

function addRules(tree: Tree, projectRootPath: string) {
    const existingConfig = readFlatEslintConfig(tree, projectRootPath);
    const testingLibraryConfig = generateTestingLibraryConfig();

    if (!existingConfig) {
        return;
    }

    const mergedConfig = mergeFlatConfigs(existingConfig, testingLibraryConfig);

    writeFlatEslintConfig(tree, projectRootPath, mergedConfig);
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
