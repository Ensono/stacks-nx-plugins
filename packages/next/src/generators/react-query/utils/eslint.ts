import { mergeEslintConfigs, updateEslintConfig } from '@ensono-stacks/core';
import { Tree } from '@nx/devkit';
import { Linter } from 'eslint';

import { installDependencies } from './dependancies';
import { ReactQueryGeneratorSchema } from '../schema';

const reactQueryESLintConfig: Linter.Config = {
    extends: ['plugin:@tanstack/eslint-plugin-query/recommended'],
};

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
    options: ReactQueryGeneratorSchema,
) => {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(baseConfig, reactQueryESLintConfig);
    });

    return installDependencies(tree, options);
};
