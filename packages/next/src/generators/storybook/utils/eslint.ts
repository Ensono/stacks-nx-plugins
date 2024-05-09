import { mergeEslintConfigs, updateEslintConfig } from '@ensono-stacks/core';
import { GeneratorCallback, Tree } from '@nx/devkit';
import { Linter } from 'eslint';

const storybookESLintConfig: Linter.Config = {
    extends: ['plugin:storybook/recommended'],
    overrides: [
        {
            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
            rules: {
                'storybook/no-uninstalled-addons': [
                    'error',
                    {
                        packageJsonLocation: '../../package.json',
                    },
                ],
            },
        },
    ],
};

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
): GeneratorCallback => {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        return mergeEslintConfigs(baseConfig, storybookESLintConfig);
    });

    return () => {};
};
