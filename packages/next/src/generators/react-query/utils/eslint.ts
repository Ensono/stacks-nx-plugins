import { mergeEslintConfigs, updateEslintConfig } from '@ensono-stacks/core';
import { GeneratorCallback, Tree } from '@nx/devkit';
import { Linter } from 'eslint';

const reactQueryESLintConfig: Linter.Config = {
    extends: ['plugin:@tanstack/eslint-plugin-query/recommended'],
};

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
): GeneratorCallback => {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(baseConfig, reactQueryESLintConfig);
    });

    return () => {};
};
