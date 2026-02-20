import { mergeEslintConfig } from '@ensono-stacks/core';
import { GeneratorCallback, Tree } from '@nx/devkit';

function generateReactQueryConfig(): string {
    return `import baseConfig from '../../eslint.config.mjs';
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';

export default [
  ...baseConfig,
  
  // TanStack Query configuration
  {
    name: 'react-query/recommended',
    plugins: { '@tanstack/query': tanstackQueryPlugin },
    rules: {
      ...tanstackQueryPlugin.configs.recommended.rules,
    },
  },
];
`;
}

export const updateESLint = (
    tree: Tree,
    projectRootPath: string,
): GeneratorCallback => {
    const reactQueryConfig = generateReactQueryConfig();

    mergeEslintConfig(tree, projectRootPath, reactQueryConfig);

    return () => {};
};
