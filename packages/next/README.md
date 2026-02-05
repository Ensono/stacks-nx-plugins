# @ensono-stacks/next

Please visit the stacks documentation page for `next`
[here](https://stacks.ensono.com/docs/getting_started/next/ensono-stacks-next)
for more information

## Generators and Executors

View a list of the plugin executors/generators through the following command:

```bash
nx list @ensono-stacks/next
```

## ESLint v9 Flat Config

The `@ensono-stacks/next:init` generator creates/updates ESLint configuration
for Next.js applications using the flat config format.

**Generated file**: `apps/<next-app>/eslint.config.js`

**Key features**:

- Extends workspace base configuration
- Integrates `@next/eslint-plugin-next` with recommended and core-web-vitals
  rules
- Adds `eslint-plugin-testing-library` for React test files
- Configures `.next/` directory ignores
- Uses ESM syntax with named config objects

**Example output**:

```javascript
// apps/<next-app>/eslint.config.js
import baseConfig from '../../eslint.config.js';
import nextEslintPluginNext from '@next/eslint-plugin-next';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
    ...baseConfig,

    {
        name: 'next/recommended',
        plugins: { '@next/next': nextEslintPluginNext },
        rules: {
            ...nextEslintPluginNext.configs.recommended.rules,
            ...nextEslintPluginNext.configs['core-web-vitals'].rules,
        },
    },

    {
        name: 'next/testing-library',
        files: [
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.test.ts',
            '**/*.test.tsx',
        ],
        ...testingLibrary.configs['flat/react'],
    },

    { name: 'next/ignores', ignores: ['.next/**/*'] },
];
```

**Config merging**: The generator uses `mergeEslintConfig()` from
`@ensono-stacks/core` to intelligently merge configurations:

- Deduplicates imports (reuses existing variable names)
- Detects duplicate configs by name, files pattern, or plugin keys
- Preserves existing configurations while adding new ones

## Development

### Building

Run the following command to build the plugin

```bash
nx build next
```

### Tests

Run the following to execute the unit tests via [jest](https://jestjs.io/).

```bash
nx test next
```

### Linting

Run the following to lint the code using [ESLint](https://eslint.org/).

```bash
nx lint next
```

### Publish

Run the following to publish the NPM package

```bash
nx publish next
```
