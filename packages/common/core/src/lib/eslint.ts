import {
    joinPathFragments,
    logger,
    updateJson,
    writeJson,
    Tree,
} from '@nrwl/devkit';
import { spawnSync } from 'child_process';
import { Linter } from 'eslint';
import { SyntaxKind } from 'ts-morph';

import { ensureArray } from './array';
import { tsMorphTree, updateJsonInJS } from './ts-morph';

export function formatFilesWithEslint(project: string) {
    return () => {
        const { stdout, stderr } = spawnSync(
            'npx',
            ['nx', 'lint', project, '--fix'],
            {
                env: { ...process.env, FORCE_COLOR: '3' },
                shell: true,
            },
        );

        if (stderr.toString()) {
            logger.log(stdout.toString());
        }
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
    };

    if (extensions && extensions.length > 0) {
        formattedConfig.extends = extensions;
    }

    if (plugins && plugins.length > 0) {
        formattedConfig.plugins = plugins;
    }

    if (settings) {
        formattedConfig.settings = settings;
    }

    if (rules) {
        formattedConfig.rules = rules;
    }

    if (overrides) {
        formattedConfig.overrides = overrides;
    }

    return formattedConfig;
}

export function mergeEslintConfigs(...configs: Linter.Config[]): Linter.Config {
    if (configs.length <= 1) {
        return formatConfig(configs[0] || {});
    }

    const [a, b, ...base] = configs;
    const aConfig = { ...a };
    const bConfig = { ...b };

    // Merge top-level properties with user preference
    aConfig.plugins = [
        ...new Set([...(aConfig.plugins || []), ...(bConfig.plugins || [])]),
    ];
    aConfig.extends = [
        ...new Set([...(aConfig.extends || []), ...(bConfig.extends || [])]),
    ];

    if (bConfig.overrides) {
        bConfig.overrides.forEach(override => {
            // Find matching file override in a
            const indexOfOverride = aConfig.overrides?.findIndex(
                ({ files }) => {
                    // Clone to preserve original config
                    const filesClone = [...ensureArray(files)];
                    const overrideFilesClone = [...ensureArray(override.files)];
                    return (
                        filesClone.sort().toString() ===
                        overrideFilesClone.sort().toString()
                    );
                },
            );

            // a does not have an override, so set it
            if (indexOfOverride === undefined) {
                aConfig.overrides = [override];
                return;
            }

            // Matching override exists
            if (aConfig.overrides && indexOfOverride >= 0) {
                const baseOverride = aConfig.overrides[indexOfOverride];
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
                if (baseOverride.excludedFiles || override.excludedFiles) {
                    baseOverride.excludedFiles = [
                        ...new Set([
                            ...(baseOverride.excludedFiles || []),
                            ...(override.excludedFiles || []),
                        ]),
                    ];
                }
                baseOverride.parserOptions = {
                    ...baseOverride.parserOptions,
                    ...override.parserOptions,
                };
                baseOverride.rules = {
                    ...baseOverride.rules,
                    ...override.rules,
                };
                // No matching override exists
            } else {
                aConfig.overrides?.push(override);
            }
        });
    }

    if (bConfig.rules) {
        aConfig.rules = {
            ...aConfig.rules,
            ...bConfig.rules,
        };
    }

    if (bConfig.settings) {
        aConfig.settings = {
            ...aConfig.settings,
            ...bConfig.settings,
        };
    }

    if (base.length > 0) {
        return mergeEslintConfigs(aConfig, ...base);
    }

    return formatConfig(aConfig);
}

export function updateEslintConfig(
    tree: Tree,
    path: string,
    updater: (config: Linter.Config) => Linter.Config,
): void {
    const configPathJSON = joinPathFragments(path, '.eslintrc.json');
    const configPathJS = joinPathFragments(path, '.eslintrc.js');

    const configPath: false | string =
        (tree.exists(configPathJSON) && configPathJSON) ||
        (tree.exists(configPathJS) && configPathJS);

    if (configPath) {
        if (configPath.endsWith('.json')) {
            updateJson(tree, configPath, updater);
        }

        if (configPath.endsWith('.js')) {
            const project = tsMorphTree(tree);
            const source = project.addSourceFileAtPath(configPath);
            const node = source.getDescendantsOfKind(
                SyntaxKind.ObjectLiteralExpression,
            )[0];
            updateJsonInJS(node, updater);
        }
    } else {
        writeJson(tree, configPathJSON, updater({}));
    }
}
