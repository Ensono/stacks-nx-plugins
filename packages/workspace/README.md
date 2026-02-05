# @ensono-stacks/workspace

Please visit the stacks documentation page for `workspace`
[here](https://stacks.ensono.com/docs/getting_started/workspace/ensono-stacks-workspace)
for more information

## Generators and Executors

View a list of the plugin executors/generators through the following command:

```bash
nx list @ensono-stacks/workspace
```

## ESLint v9 Flat Config

The `@ensono-stacks/workspace:init` generator creates an ESLint v9 flat
configuration at the workspace root:

**Generated file**: `eslint.config.js`

**Key features**:

- ESM format with named imports
- TypeScript ESLint meta-package (`typescript-eslint@^8.54.0`)
- Security, unicorn, and import plugins
- Nx module boundary enforcement
- Prettier integration
- JSON and test file configurations

**Example output**:

```javascript
// eslint.config.js (workspace root)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nxPlugin from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import unicornPlugin from 'eslint-plugin-unicorn';
import prettierConfig from 'eslint-plugin-prettier/recommended';

export default [
    { ignores: ['**/dist/', '**/node_modules/', '**/.nx/', '**/coverage/'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { '@nx': nxPlugin },
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    /* ... */
                },
            ],
        },
    },
    // ... additional plugin configs
];
```

Project-level configs extend the root:

```javascript
// packages/<project>/eslint.config.js
import baseConfig from '../../eslint.config.js';
export default [...baseConfig];
```

## Development

### Building

Run the following command to build the plugin

```bash
nx build workspace
```

### Tests

Run the following to execute the unit tests via [jest](https://jestjs.io/).

```bash
nx test workspace
```

### Linting

Run the following to lint the code using [ESLint](https://eslint.org/).

```bash
nx lint workspace
```

### Publish

Run the following to publish the NPM package

```bash
nx publish workspace
```
