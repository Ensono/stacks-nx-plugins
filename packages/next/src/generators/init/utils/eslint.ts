import { mergeEslintConfig, writeFlatEslintConfig } from '@ensono-stacks/core';
import {
    ProjectConfiguration,
    Tree,
    addDependenciesToPackageJson,
} from '@nx/devkit';

import {
    ESLINT_PLUGIN_TESTING_LIBRARY_VERSION,
    NEXT_ESLINT_PLUGIN_VERSION,
} from './constants';

function generateNextConfig(options: { isCustomServer: boolean }): string {
    const customServerRules = options.isCustomServer
        ? `
  // Custom server rules
  {
    name: 'next/custom-server',
    files: ['server/main.ts'],
    rules: {
      'unicorn/no-process-exit': 'off',
    },
  },`
        : '';

    return `import baseConfig from '../../eslint.config.mjs';
import nextPlugin from '@next/eslint-plugin-next';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  // Ignore Next.js generated files
  {
    ignores: ['next-env.d.ts', '.next/**/*', 'out/**/*'],
  },
  
  ...baseConfig,
  
  // Next.js config file overrides
  {
    name: 'next/config-overrides',
    files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  
  // Next.js plugin
  {
    name: 'next/recommended',
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  
  // Testing Library for React
  {
    name: 'next/testing-library',
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
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
  
  // TypeScript overrides for Next.js
  {
    name: 'next/typescript-overrides',
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'unicorn/prefer-top-level-await': 'off',
    },
  },${customServerRules}
];
`;
}

function addRules(
    tree: Tree,
    projectRootPath: string,
    options: { isCustomServer: boolean },
) {
    // Delete legacy .eslintrc.json if it exists (created by @nx/next)
    const legacyConfigPath = `${projectRootPath}/.eslintrc.json`;

    if (tree.exists(legacyConfigPath)) {
        tree.delete(legacyConfigPath);
    }

    const configPath = `${projectRootPath}/eslint.config.mjs`;
    // Always use the full config with imports since mergeEslintConfig handles merging
    const nextConfig = generateNextConfig(options);

    mergeEslintConfig(tree, projectRootPath, nextConfig);
}

function addEslintDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            'eslint-plugin-testing-library':
                ESLINT_PLUGIN_TESTING_LIBRARY_VERSION || 'latest',
            '@next/eslint-plugin-next': NEXT_ESLINT_PLUGIN_VERSION || 'latest',
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
