# Quickstart: Jest to Vitest Migration

**Feature**: 004-migrate-to-vitest  
**Date**: 5 February 2026

## Overview

This guide describes the migration from Jest to Vitest for the Ensono Stacks Nx
Plugins monorepo. The migration leverages Nx's `@nx/vitest` plugin with inferred
task detection.

## Prerequisites

- Node.js 24.x
- pnpm 9.x
- Nx 22.4.4

## Migration Steps

### Phase 1: Dependencies

```bash
# Remove Jest packages
pnpm remove @nx/jest @types/jest jest jest-environment-jsdom jest-environment-node jest-util ts-jest eslint-plugin-jest

# Add Vitest packages
pnpm add -D @nx/vitest@22.4.4 @nx/vite@22.4.4 vitest @vitest/coverage-v8
```

### Phase 2: Workspace Configuration

#### 2.1 Create Workspace Configuration

Create `vitest.workspace.ts` at workspace root:

```typescript
// vitest.workspace.ts
export default [
    '**/vite.config.{mjs,js,ts,mts}',
    '**/vitest.config.{mjs,js,ts,mts}',
];
```

#### 2.2 Update nx.json

Replace Jest plugin with Vitest plugins:

```json
{
    "plugins": [
        {
            "plugin": "@nx/vitest",
            "exclude": ["e2e/**/*"],
            "options": {
                "testTargetName": "test",
                "ciTargetName": "test-ci",
                "testMode": "watch"
            }
        },
        {
            "plugin": "@nx/vitest",
            "include": ["e2e/**/*"],
            "options": {
                "testTargetName": "e2e-local",
                "ciTargetName": "e2e-ci"
            }
        }
    ]
}
```

Remove `@nx/jest:jest` from `targetDefaults`.

#### 2.3 Update package.json Scripts

```json
{
    "scripts": {
        "test": "nx run-many --target test --all --parallel 8"
    }
}
```

Remove `NODE_OPTIONS='--experimental-vm-modules'` - no longer needed.

### Phase 3: Project Configurations

For each package, create `vitest.config.mts` (standalone, no shared config).

> **Note**: The `cacheDir` path must resolve to the workspace root's
> `node_modules/.vite/` directory. Adjust the relative path based on project
> depth (e.g., `../../` for `packages/next/`, `../../../` for
> `packages/common/core/`).

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    // Adjust path to reach workspace root node_modules
    cacheDir: '<path-to-root>/node_modules/.vite/packages/<package-name>',
    test: {
        name: '<package-name>',
        watch: false,
        globals: true,
        environment: 'node',
        include: [
            '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        reporters: ['default'],
        coverage: {
            reportsDirectory: './test-output/vitest/coverage',
            provider: 'v8' as const,
        },
    },
}));
```

For E2E projects, add longer timeout:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    // Adjust path to reach workspace root node_modules
    cacheDir: '<path-to-root>/node_modules/.vite/e2e/<project-name>',
    test: {
        name: '<project-name>',
        watch: false,
        globals: true,
        environment: 'node',
        testTimeout: 180_000,
        include: [
            '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        reporters: ['default'],
        coverage: {
            reportsDirectory: './test-output/vitest/coverage',
            provider: 'v8' as const,
        },
    },
}));
```

### Phase 4: Remove Jest Artifacts

```bash
# Remove Jest config files
rm jest.config.ts jest.preset.js
rm packages/*/jest.config.ts
rm e2e/*/jest.config.ts

# Remove from project.json files (test targets will be inferred)
# Edit each project.json to remove explicit "test" target
```

### Phase 5: Update Test Files

Replace Jest-specific APIs with Vitest equivalents:

| Jest                        | Vitest                         |
| --------------------------- | ------------------------------ |
| `jest.mock('module')`       | `vi.mock('module')`            |
| `jest.fn()`                 | `vi.fn()`                      |
| `jest.spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')`      |
| `as jest.Mock`              | `as Mock` (import from vitest) |

Example transformation:

```typescript
// Before
import { someFunction } from './module';
jest.mock('./module');
const mockFn = jest.fn();
const spy = jest.spyOn(console, 'log');

// After
import { vi, Mock } from 'vitest';
import { someFunction } from './module';
vi.mock('./module');
const mockFn = vi.fn();
const spy = vi.spyOn(console, 'log');
```

### Phase 6: Update ESLint Configuration

In `eslint.config.mjs`, replace Jest globals:

```javascript
// Before
{
  files: ['**/*.spec.ts', '**/*.spec.tsx'],
  languageOptions: {
    globals: {
      ...globals.jest,
    },
  },
}

// After
{
  files: ['**/*.spec.ts', '**/*.spec.tsx'],
  languageOptions: {
    globals: {
      vi: 'readonly',
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
      test: 'readonly',
    },
  },
}
```

### Phase 7: Verify Migration

```bash
# Run all tests
pnpm exec nx run-many -t test --all

# Run with coverage
pnpm exec nx run-many -t test --all --coverage

# Run E2E tests
pnpm exec nx run-many -t e2e-local --all

# Verify inferred targets
pnpm exec nx show project next --web
```

## Project Checklist

### Packages (10 projects)

- [ ] `packages/azure-node/vitest.config.mts`
- [ ] `packages/azure-react/vitest.config.mts`
- [ ] `packages/common/core/vitest.config.mts`
- [ ] `packages/common/test/vitest.config.mts`
- [ ] `packages/create/vitest.config.mts`
- [ ] `packages/logger/vitest.config.mts`
- [ ] `packages/next/vitest.config.mts`
- [ ] `packages/playwright/vitest.config.mts`
- [ ] `packages/rest-client/vitest.config.mts`
- [ ] `packages/workspace/vitest.config.mts`

### E2E Projects (8 projects)

- [ ] `e2e/azure-node-e2e/vitest.config.mts`
- [ ] `e2e/azure-react-e2e/vitest.config.mts`
- [ ] `e2e/create-e2e/vitest.config.mts`
- [ ] `e2e/logger-e2e/vitest.config.mts`
- [ ] `e2e/next-e2e/vitest.config.mts`
- [ ] `e2e/playwright-e2e/vitest.config.mts`
- [ ] `e2e/rest-client-e2e/vitest.config.mts`
- [ ] `e2e/workspace-e2e/vitest.config.mts`

### Test File Updates (jest._ → vi._)

- [ ] `packages/playwright/src/generators/visual-regression/generator.spec.ts`
- [ ] `packages/create/bin/create-stacks-workspace.spec.ts`
- [ ] `packages/create/bin/dependencies.spec.ts`
- [ ] `packages/azure-node/src/generators/app-insights/generator.spec.ts`
- [ ] `packages/common/core/src/utils/executedDependantGenerator.spec.ts`
- [ ] `packages/common/core/src/utils/thirdPartyDependencyWarning.spec.ts`
- [ ] `packages/common/core/src/utils/deploymentGeneratorMessage.spec.ts`
- [ ] `packages/common/core/src/utils/hasGeneratorExecuted.spec.ts`

## Troubleshooting

### "Cannot find module" errors

Ensure `nxViteTsPaths()` plugin is included in your vitest config.

### Tests not discovered

Check that `include` patterns match your test file locations.

### Coverage not meeting thresholds

Run with `--coverage` flag: `nx test <project> --coverage`

### Mock not working

Ensure `vi.mock()` is hoisted (called at top level, not inside describe/it
blocks).
