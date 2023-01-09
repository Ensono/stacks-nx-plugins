import { ensureArray } from '@ensono-stacks/core';
import {
    Tree,
    addDependenciesToPackageJson,
    updateJson,
    joinPathFragments,
} from '@nrwl/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { Linter } from 'eslint';

import { TESTING_LIBRARY_REACT_VERSION } from './constants';

function stacksEslintConfig(tree: Tree): Linter.Config {
    return {
        extends: [
            'plugin:@nrwl/nx/react-typescript',
            'plugin:testing-library/react',
            'plugin:@next/next/recommended',
            'next/core-web-vitals',
            '../../.eslintrc.js',
        ],
        ignorePatterns: ['!**/*'],
        overrides: [
            {
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                parserOptions: {
                    project: ['apps/commerce/tsconfig(.*)?.json'],
                },
                rules: {
                    'testing-library/await-async-utils': 'error',
                    'testing-library/await-async-query': 'error',
                    'testing-library/no-wait-for-side-effects': 'error',
                    'testing-library/no-manual-cleanup': 'error',
                    'testing-library/prefer-explicit-assert': 'warn',
                    'testing-library/prefer-presence-queries': 'warn',
                    'testing-library/prefer-wait-for': 'error',
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

function formatConfig(config: Linter.Config) {
    const {
        extends: extensions,
        plugins,
        settings,
        rules,
        overrides,
        ...rest
    } = config;

    const formattedConfig: Linter.Config = {
        ...rest,
        extends: extensions,
        plugins,
        settings,
        rules,
        overrides,
    };

    return formattedConfig;
}

function mergeConfig(tree: Tree, current: Linter.Config) {
    const base = { ...current };
    const stacksConfig = stacksEslintConfig(tree);

    // Merge top-level properties with user preference
    base.plugins = [
        ...new Set([...(base.plugins || []), ...(stacksConfig.plugins || [])]),
    ];
    base.extends = [
        ...new Set([...(base.extends || []), ...(stacksConfig.extends || [])]),
    ];

    if (base.overrides) {
        stacksConfig.overrides?.forEach(override => {
            const indexOfOverride = base.overrides?.findIndex(({ files }) => {
                // Clone to preserve original config
                const filesClone = [...ensureArray(files)];
                const overrideFilesClone = [...ensureArray(override.files)];
                return (
                    filesClone.sort().toString() ===
                    overrideFilesClone.sort().toString()
                );
            });

            if (indexOfOverride === undefined) {
                return;
            }

            if (base.overrides && indexOfOverride >= 0) {
                const baseOverride = base.overrides[indexOfOverride];
                if (baseOverride.plugins || override.plugins) {
                    baseOverride.plugins = [
                        ...new Set([
                            ...(baseOverride.plugins || []),
                            ...(override.plugins || []),
                        ]),
                    ];
                }
                if (baseOverride.extends || override.extends) {
                    baseOverride.extends = [
                        ...new Set([
                            ...(baseOverride.extends || []),
                            ...(override.extends || []),
                        ]),
                    ];
                }
                baseOverride.rules = {
                    ...baseOverride.rules,
                    ...override.rules,
                };
            } else {
                base.overrides?.push(override);
            }
        });
    } else {
        base.overrides = stacksConfig.overrides;
    }

    return formatConfig(base);
}

function addRules(tree: Tree, projectSourceRoot: string) {
    const projectRootConfigpathJSON = joinPathFragments(
        projectSourceRoot,
        '.eslintrc.json',
    );
    const projectRootConfigPathJS = joinPathFragments(
        projectSourceRoot,
        '.eslintrc.js',
    );

    const rootConfigPath: false | string =
        (tree.exists(projectRootConfigpathJSON) && projectRootConfigpathJSON) ||
        (tree.exists(projectRootConfigPathJS) && projectRootConfigPathJS);

    if (rootConfigPath) {
        if (rootConfigPath.endsWith('.json')) {
            updateJson(tree, rootConfigPath, eslintConfig =>
                mergeConfig(tree, eslintConfig),
            );
        }
        if (rootConfigPath.endsWith('.js')) {
            const rootConfigJs = tree.read(rootConfigPath)?.toString();

            if (rootConfigJs) {
                // expect module.export = {}
                const updatedConfigContents = tsquery.replace(
                    rootConfigJs,
                    'BinaryExpression > ObjectLiteralExpression',
                    node => {
                        const rootConfig = JSON.parse(
                            rootConfigJs.slice(node.pos, node.end),
                        );
                        return JSON.stringify(mergeConfig(tree, rootConfig));
                    },
                );
                tree.write(rootConfigPath, updatedConfigContents);
            }
        }
    } else {
        tree.write(
            joinPathFragments(projectSourceRoot, '.eslintrc.json'),
            JSON.stringify(stacksEslintConfig(tree)),
        );
    }
}

function addEslintDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            'testing-library/react': TESTING_LIBRARY_REACT_VERSION || 'latest',
        },
    );
}

export function addEslint(tree: Tree, projectSourceRoot: string) {
    addRules(tree, projectSourceRoot);
    addEslintDependencies(tree);
}
