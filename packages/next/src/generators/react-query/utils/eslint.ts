import { mergeEslintConfigs, updateEslintConfig } from '@ensono-stacks/core';
import { Tree } from '@nx/devkit';
import { Linter } from 'eslint';

const reactQueryESLintConfig: Linter.Config = {
    extends: ['plugin:@tanstack/eslint-plugin-query/recommended'],
};

export const updateESLint = (tree: Tree, projectRootPath: string) => {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(baseConfig, reactQueryESLintConfig);
    });
};
