# Research: Jest to Vitest Migration with Nx

**Feature**: 004-migrate-to-vitest  
**Date**: 5 February 2026

## Executive Summary

Nx provides first-class Vitest support through the `@nx/vitest` package
(separate from `@nx/vite` as of Nx 22). The plugin supports **inferred task
detection**, automatically creating `test` targets for any project with a
`vitest.config.ts` file. There is no automatic Jest-to-Vitest migration
generator, so migration must be manual but straightforward due to Vitest's
Jest-compatible API.

---

## Research Findings

### 1. Nx Vitest Plugin Architecture

**Decision**: Use `@nx/vitest@22.4.4` (matching Nx version)

**Rationale**:

- Dedicated `@nx/vitest` package provides better separation of concerns
- `@nx/vite` Vitest features are deprecated and will be removed in Nx 23
- Plugin auto-detects `vitest.config.ts` files and creates inferred `test`
  targets

**Alternatives Considered**:

- ❌ `@nx/vite` with Vitest built-in: Deprecated path, will break in Nx 23
- ❌ Manual executor configuration: Unnecessary when inferred tasks work

### 2. Configuration File Recognition

**Decision**: Use `vitest.config.ts` per project + `vitest.workspace.ts` at root

**Rationale**:

- Nx uses `vitest.workspace.ts` to discover all project configs in the monorepo
- Each project maintains its own `vitest.config.ts` for project-specific
  settings
- Nx orchestrates via `nx run-many -t test` and `nx affected -t test`
- Inferred tasks require recognized config file patterns

**Recognized Patterns** (in order of precedence):

1. `vitest.config.mts` ← **Nx default (ESM)**
2. `vitest.config.ts`
3. `vitest.config.mjs`
4. `vitest.config.js`
5. `vite.config.ts` (if it has `test` property)

### 3. Vitest Workspace Configuration

**Decision**: Use `vitest.workspace.ts` at workspace root to define project
discovery

**Rationale**:

- Nx **does** use `vitest.workspace.ts` for monorepo test orchestration
- The workspace file defines glob patterns to discover all project configs
- Enables `vitest` CLI to run tests across the entire workspace

**Standard Nx Pattern**:

```typescript
// vitest.workspace.ts (root)
export default [
    '**/vite.config.{mjs,js,ts,mts}',
    '**/vitest.config.{mjs,js,ts,mts}',
];
```

This file tells Vitest to discover all `vitest.config.ts` files across the
monorepo.

### 4. Per-Project Configuration

**Decision**: Each project gets a standalone `vitest.config.mts` with full
configuration

**Rationale**:

- Matches Nx's default generated pattern
- No shared config file to maintain
- Each project is self-contained and independently configurable
- Coverage thresholds can be enforced via CI or nx.json targetDefaults

**Example Pattern** (based on Nx-generated configs):

```typescript
// packages/next/vitest.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    // Path to workspace root node_modules (adjust based on project depth)
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

### 4. Nx Plugin Configuration

**Decision**: Configure `@nx/vitest` plugin in `nx.json` with separate unit/E2E
patterns

**Rationale**:

- E2E tests need different target names (`e2e-local`, `e2e-ci`) than unit tests
  (`test`)
- Plugin supports `include`/`exclude` patterns to separate concerns
- Inferred tasks eliminate need for explicit `project.json` test targets

**Configuration**:

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

### 5. TypeScript Path Resolution

**Decision**: Use `nxViteTsPaths()` plugin from `@nx/vite`

**Rationale**:

- Required for monorepo path alias resolution (`@ensono-stacks/*`)
- Reads paths from `tsconfig.base.json`
- Standard Nx recommendation for Vitest in monorepos

**Note**: This requires `@nx/vite` as a dependency even though we're using
`@nx/vitest` for the executor.

### 6. Jest API Migration

**Decision**: Replace `jest.*` with `vi.*` in test files

**Rationale**:

- Vitest uses `vi` namespace for mocking/spying instead of `jest`
- Most APIs are 1:1 compatible
- `describe`, `it`, `expect`, `beforeEach`, `afterEach` work unchanged

**Migration Map**: | Jest | Vitest | |------|--------| | `jest.mock()` |
`vi.mock()` | | `jest.fn()` | `vi.fn()` | | `jest.spyOn()` | `vi.spyOn()` | |
`jest.Mock` | `Mock` (from vitest) | | `jest.clearAllMocks()` |
`vi.clearAllMocks()` | | `jest.resetAllMocks()` | `vi.resetAllMocks()` |

**Files Requiring Updates** (20 occurrences identified):

- `packages/playwright/src/generators/visual-regression/generator.spec.ts`
- `packages/create/bin/create-stacks-workspace.spec.ts`
- `packages/create/bin/dependencies.spec.ts`
- `packages/azure-node/src/generators/app-insights/generator.spec.ts`
- `packages/common/core/src/utils/*.spec.ts` (4 files)

### 7. ESLint Configuration

**Decision**: Replace `globals.jest` with Vitest globals, remove
`eslint-plugin-jest`

**Rationale**:

- Vitest uses different global identifiers (`vi` instead of `jest`)
- `eslint-plugin-vitest` provides Vitest-specific linting rules
- Test file patterns remain the same (`**/*.spec.ts`)

**Changes**:

```javascript
// Before (eslint.config.mjs)
import globals from 'globals';
// ...
languageOptions: {
  globals: {
    ...globals.jest,
  },
},

// After
import globals from 'globals';
// ...
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
  },
},
```

### 8. Coverage Configuration

**Decision**: Use `@vitest/coverage-v8` with existing threshold requirements

**Rationale**:

- V8 coverage is faster than Istanbul
- Compatible with existing 80% threshold requirements
- Reports in same formats (text, HTML)
- Output to same directories (`coverage/<project-root>`)

### 9. E2E Test Configuration

**Decision**: Maintain 180s timeout, use separate Vitest plugin instance

**Rationale**:

- E2E tests against Verdaccio are inherently slow
- Separate plugin config allows different target names
- `testTimeout: 180_000` in vitest config (same as Jest)

### 10. Dependency Changes

**Decision**: Remove Jest packages, add Vitest packages

**Packages to Remove**:

- `@nx/jest`
- `@types/jest`
- `jest`
- `jest-environment-jsdom`
- `jest-environment-node`
- `jest-util`
- `ts-jest`
- `eslint-plugin-jest`

**Packages to Add**:

- `@nx/vitest@22.4.4`
- `@nx/vite@22.4.4` (for `nxViteTsPaths` plugin)
- `vitest@^4.0.0`
- `@vitest/coverage-v8@^4.0.0`
- `eslint-plugin-vitest@^1.0.0` (optional, for lint rules)

---

## Generator Parity Check

**Concern**: Do any Stacks generators produce Jest configurations for consumer
workspaces?

**Finding**: Checked `packages/next/src/generators/` - no Jest config generation
found. Generators focus on application code, not test infrastructure.

**Conclusion**: No generator updates required for this migration. Consumer
workspaces manage their own test infrastructure independently.

---

## Risk Assessment

| Risk                           | Likelihood | Impact | Mitigation                                    |
| ------------------------------ | ---------- | ------ | --------------------------------------------- |
| Mock API incompatibility       | Low        | Medium | Vitest's Jest compat mode covers 99% of cases |
| Coverage report format changes | Low        | Low    | V8 produces compatible formats                |
| E2E test timing issues         | Medium     | Medium | Preserve 180s timeout explicitly              |
| IDE extension conflicts        | Low        | Low    | VS Code Vitest extension available            |
| CI pipeline failures           | Medium     | High   | Run full test suite before merge              |

---

## References

- [Nx Vitest Plugin Documentation](https://nx.dev/nx-api/vitest)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Vitest Jest Compatibility](https://vitest.dev/guide/comparisons.html#jest)
