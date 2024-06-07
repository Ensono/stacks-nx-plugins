import { mergeEslintConfigs, updateEslintConfig } from '@ensono-stacks/core';
import { GeneratorCallback, Tree } from '@nx/devkit';
import { Linter } from 'eslint';

const storybookESLintConfig: Linter.Config = {
    extends: ['plugin:storybook/recommended'],
    ignorePatterns: ['!**/*', '.next/**/*', 'storybook-static'],
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
            parserOptions: {
                project: ['tsconfig(.*)?.json', '**/tsconfig.storybook.json'],
            },
        },
    ],
};

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
): GeneratorCallback => {
    updateEslintConfig(tree, projectRootPath, baseConfig => {
        const mergedConfig = mergeEslintConfigs(
            baseConfig,
            storybookESLintConfig,
        );
        // Overwrite parserOptions set by storybook-configuration generator
        // There seems to be a bug with the nx storybook generator where it doesn't set parserOption.project correctly
        // When a typescript eslint plugin is used, it will try to set a path to the tsconfig.storybook.json e.g apps/test-app/tsconfig.storybook.json which breaks linting
        mergedConfig.overrides[0].parserOptions =
            storybookESLintConfig.overrides[0].parserOptions;
        return mergedConfig;
    });

    return () => {};
};
