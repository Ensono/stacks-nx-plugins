import {
    joinPathFragments,
    logger,
    updateJson,
    writeJson,
    Tree,
} from '@nx/devkit';
import { spawnSync } from 'child_process';
import deepMerge from 'deepmerge';
import { Linter } from 'eslint';
import { SyntaxKind } from 'ts-morph';

import { combineMerge } from './merge';
import { tsMorphTree, updateJsonInJS } from './ts-morph';

export function formatFilesWithEslint(project: string) {
    return () => {
        const { stdout, stderr } = spawnSync(
            'npx',
            ['nx', 'run', `${project}:lint`, '--fix', '--verbose'],
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
    const result = deepMerge(a, b, {
        arrayMerge: (target, source, options) =>
            combineMerge(target, source, options, 'files'),
    });

    if (base.length > 0) {
        return mergeEslintConfigs(result, ...base);
    }
    return formatConfig(result);
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
