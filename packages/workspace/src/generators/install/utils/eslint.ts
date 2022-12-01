import {
  Tree,
  addDependenciesToPackageJson,
  getWorkspaceLayout,
  updateJson,
} from '@nrwl/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';

import {
  ESLINT_CONFIG_PRETTIER_VERSION,
  ESLINT_IMPORT_RESOLVER_TS_VERSION,
  ESLINT_PLUGIN_COMPAT_VERSION,
  ESLINT_PLUGIN_IMPORT_VERSION,
  ESLINT_PLUGIN_PRETTIER_VERSION,
  ESLINT_PLUGIN_SECURITY_VERSION,
  ESLINT_PLUGIN_UNICORN_VERSION,
  ESLINT_VERSION,
} from './constants';

interface EslintConfig {
  plugins: string[];
  extends: string[];
  overrides: {
    files: string[];
    extends?: string[];
    plugins?: string[];
    rules?: Record<string, unknown>;
  }[];
}

function stacksEslintConfig(tree: Tree): EslintConfig {
  return {
    plugins: ['@nrwl/nx', 'import', 'security'],
    extends: [
      'eslint-config-prettier',
      'airbnb',
      'plugin:prettier/recommend',
      'plugin:unicorn/recommend',
      'plugin:compat/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:security/recommended',
    ],
    overrides: [
      {
        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
        rules: {
          '@nrwl/nx/enforce-module-boundaries': [
            'error',
            {
              enforceBuildableLibDependency: true,
              allow: [],
              depConstraints: [
                {
                  sourceTag: '*',
                  onlyDependOnLibsWithTags: ['*'],
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
                  pattern: `@${getWorkspaceLayout(tree).npmScope}/**`,
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
          'no-console': 'off',
          'no-duplicate-imports': 'error',
          'no-irregular-whitespace': 'error',
          'no-shadow': 'off',
          'no-use-before-define': 'off',
          'no-restricted-exports': 'off',
          'security/detect-object-injection': 'off',
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
              },
              replacements: {
                env: {
                  environment: false,
                },
              },
            },
          ],
        },
      },
      {
        files: ['*.ts', '*.tsx'],
        extends: ['plugin:@nrwl/nx/typescript'],
        rules: {
          '@typescript-eslint/no-empty-function': 'off',
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/ban-ts-comment': 'off',
          '@typescript-eslint/no-unsafe-call': 'off',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/interface-name-prefix': 'off',
          '@typescript-eslint/no-floating-promises': 'error',
          '@typescript-eslint/no-use-before-define': ['error'],
          '@typescript-eslint/no-unused-vars': 'off',
          '@typescript-eslint/no-shadow': 'error',
          'unicorn/prefer-node-protocol': 'off',
        },
      },
    ],
  };
}

function mergeConfig(tree: Tree, current: EslintConfig) {
  const base = { ...current };
  const stacksConfig = stacksEslintConfig(tree);

  // Merge top-level properties with user preference
  base.plugins = [...new Set([...base.plugins, ...stacksConfig.plugins])];
  base.extends = [...new Set([...base.plugins, ...stacksConfig.extends])];

  if (base.overrides) {
    stacksConfig.overrides.forEach((override) => {
      const indexOfOverride = base.overrides.findIndex(
        ({ files }) =>
          files.sort().toString() === override.files.sort().toString()
      );

      const baseOverride = base.overrides[indexOfOverride];

      if (indexOfOverride) {
        if (baseOverride.plugins || override.plugins) {
          baseOverride.plugins = [
            ...new Set([...baseOverride.plugins, ...override.plugins]),
          ];
        }
        if (baseOverride.extends || override.extends) {
          baseOverride.extends = [
            ...new Set([...baseOverride.plugins, ...override.extends]),
          ];
        }
        baseOverride.rules = {
          ...baseOverride.rules,
          ...override.rules,
        };
      } else {
        base.overrides.push(override);
      }
    });
  } else {
    base.overrides = stacksConfig.overrides;
  }

  return base;
}

function addRules(tree: Tree) {
  const rootConfigPath: false | string =
    (tree.exists('.eslintrc.json') && '.eslintrc.json') ||
    (tree.exists('.eslintrc.js') && '.eslintrc.js');

  if (rootConfigPath) {
    if (rootConfigPath.endsWith('.json')) {
      updateJson(tree, rootConfigPath, (eslintConfig) =>
        mergeConfig(tree, eslintConfig)
      );
    }
    if (rootConfigPath.endsWith('.js')) {
      const rootConfigJs = tree.read(rootConfigPath).toString();

      // expect module.export = {}
      const updatedConfigContents = tsquery.replace(
        rootConfigJs,
        'BinaryExpression > ObjectLiteralExpression',
        (node) => {
          const rootConfig = JSON.parse(rootConfigJs.slice(node.pos, node.end));
          return JSON.stringify(mergeConfig(tree, rootConfig));
        }
      );
      tree.write(rootConfigPath, updatedConfigContents);
    }
  } else {
    tree.write(
      '.eslintrc.js',
      `module.exports = ${JSON.stringify(stacksEslintConfig(tree))}`
    );
  }
}

function addEslintDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      eslint: ESLINT_VERSION,
      'eslint-config-prettier': ESLINT_CONFIG_PRETTIER_VERSION,
      'eslint-import-resolver-typescript': ESLINT_IMPORT_RESOLVER_TS_VERSION,
      'eslint-plugin-compat': ESLINT_PLUGIN_COMPAT_VERSION,
      'eslint-plugin-import': ESLINT_PLUGIN_IMPORT_VERSION,
      'eslint-plugin-prettier': ESLINT_PLUGIN_PRETTIER_VERSION,
      'eslint-plugin-security': ESLINT_PLUGIN_SECURITY_VERSION,
      'eslint-plugin-unicorn': ESLINT_PLUGIN_UNICORN_VERSION,
    }
  );
}

export function addEslint(tree: Tree) {
  addRules(tree);

  return addEslintDependencies(tree);
}
