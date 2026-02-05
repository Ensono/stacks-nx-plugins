import { mergeEslintConfig, writeFlatEslintConfig } from '@ensono-stacks/core';
import { GeneratorCallback, Tree } from '@nx/devkit';

function generateStorybookConfig(): string {
    return `import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  
  // Storybook configuration
  {
    name: 'storybook/recommended',
    files: ['**/*.stories.ts', '**/*.stories.tsx', '.storybook/**/*'],
    rules: {
      'storybook/no-uninstalled-addons': [
        'error',
        {
          packageJsonLocation: '../../package.json',
        },
      ],
    },
    ignores: ['.next/**/*', 'storybook-static/**/*'],
  },
];
`;
}

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
): GeneratorCallback => {
    const storybookConfig = generateStorybookConfig();

    mergeEslintConfig(tree, projectRootPath, storybookConfig);

    return () => {};
};
