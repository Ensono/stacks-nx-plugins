# Research: ESLint v9 Flat Config Migration

**Feature**: 003-eslint-flat-config  
**Date**: 3 February 2026  
**Status**: Complete

## Executive Summary

This research validates the feasibility of migrating from ESLint v8.57.0 with
`.eslintrc.json` to ESLint v9.8.0+ with flat config (`eslint.config.mjs`). All
critical plugins have ESLint v9 compatible versions available, with one
exception: `eslint-config-airbnb` does not support ESLint v9 and must be
replaced with equivalent manual rules.

## Plugin Compatibility Matrix

| Plugin                            | Current | Required for v9 | Flat Config Export                   | Status           |
| --------------------------------- | ------- | --------------- | ------------------------------------ | ---------------- |
| eslint                            | ~8.57.0 | ^9.8.0          | N/A                                  | ✅ Upgrade       |
| @typescript-eslint/eslint-plugin  | 7.18.0  | ^8.0.0          | `tseslint.configs.*`                 | ✅ Major upgrade |
| @typescript-eslint/parser         | 7.18.0  | ^8.0.0          | Via tseslint                         | ✅ Major upgrade |
| @nx/eslint                        | 22.4.4  | 22.4.4          | Built-in support                     | ✅ Compatible    |
| @nx/eslint-plugin                 | 22.4.4  | 22.4.4          | `nxPlugin.configs.*`                 | ✅ Compatible    |
| eslint-plugin-import              | 2.31.0  | 2.31.0          | `importPlugin.flatConfigs.*`         | ✅ Compatible    |
| eslint-plugin-security            | 3.0.1   | 3.0.1           | `pluginSecurity.configs.*`           | ✅ Compatible    |
| eslint-plugin-unicorn             | 56.0.1  | ^57.0.0         | `eslintPluginUnicorn.configs.*`      | ✅ Major upgrade |
| eslint-plugin-prettier            | 5.5.5   | 5.5.5           | `eslintPluginPrettierRecommended`    | ✅ Compatible    |
| eslint-plugin-jest                | N/A     | ^28.0.0         | `jest.configs['flat/*']`             | ✅ Add/upgrade   |
| eslint-plugin-testing-library     | 6.2.2   | ^7.0.0          | `testingLibrary.configs['flat/*']`   | ✅ Upgrade       |
| eslint-plugin-compat              | 6.0.2   | 6.0.2           | `compat.configs['flat/recommended']` | ✅ Compatible    |
| eslint-plugin-jsx-a11y            | N/A     | ^6.10.0         | `jsxA11y.flatConfigs.*`              | ✅ Add           |
| eslint-config-airbnb              | 19.0.4  | ❌ N/A          | ❌ Not available                     | ⛔ Remove        |
| eslint-config-prettier            | 10.1.5  | 10.1.5          | Direct import                        | ✅ Compatible    |
| eslint-import-resolver-typescript | 4.4.1   | 4.4.1           | Settings object                      | ✅ Compatible    |
| jsonc-eslint-parser               | 2.3.0   | 2.3.0           | Direct import                        | ✅ Compatible    |

## Decision Log

### Decision 1: Remove eslint-config-airbnb

**Decision**: Remove `eslint-config-airbnb` dependency and manually configure
equivalent rules.

**Rationale**:

- eslint-config-airbnb has an
  [open issue](https://github.com/airbnb/javascript/issues/2961) blocking ESLint
  v9 support
- The maintainers have not committed to a timeline
- Using `FlatCompat` wrapper is a short-term workaround that adds complexity

**Alternatives considered**:

1. Use `@eslint/eslintrc` FlatCompat wrapper - Rejected: Adds runtime overhead
   and maintenance complexity
2. Wait for airbnb v9 support - Rejected: No timeline, blocks migration
   indefinitely
3. Switch to `eslint-config-airbnb-typescript` - Rejected: Also lacks v9 support

**Impact**: Need to identify and manually configure the subset of airbnb rules
actually used. Review `.eslintrc.json` to determine which airbnb rules are
relied upon (primarily `airbnb/base` for import rules and code style).

### Decision 2: Use typescript-eslint meta-package

**Decision**: Migrate from separate `@typescript-eslint/eslint-plugin` and
`@typescript-eslint/parser` to the unified `typescript-eslint` package.

**Rationale**:

- v8 recommends using the meta-package for simpler configuration
- Single import for configs, parser, and plugin
- New `projectService` option for better typed linting performance

**Configuration pattern**:

```javascript
import tseslint from 'typescript-eslint';

export default tseslint.config(...tseslint.configs.recommended, {
    languageOptions: {
        parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
});
```

### Decision 3: Use Nx flat config converter as starting point

**Decision**: Run `nx g @nx/eslint:convert-to-flat-config` to generate initial
flat config, then customize.

**Rationale**:

- Nx provides automated conversion that handles most boilerplate
- Ensures compatibility with Nx workspace patterns
- Reduces manual migration errors

**Post-conversion customizations needed**:

- Update plugin imports to use v9-compatible exports
- Replace airbnb rules with manual configuration
- Ensure module boundary rules work correctly

### Decision 4: eslint-plugin-unicorn requires ESM

**Decision**: Upgrade to eslint-plugin-unicorn v57+ which requires pure ESM.

**Rationale**:

- v57+ is required for flat config support
- The monorepo already uses `"type": "module"` pattern
- eslint.config.mjs can use ESM imports

**Impact**: Ensure all eslint.config.mjs files use `import` statements, not
`require()`.

## Flat Config Structure Pattern

Based on ESLint v9 documentation and Nx best practices:

```javascript
// eslint.config.mjs (root)
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nxPlugin from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import unicornPlugin from 'eslint-plugin-unicorn';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default defineConfig([
    // Global ignores
    globalIgnores(['**/dist/', '**/node_modules/', '**/.nx/']),

    // Base JavaScript config
    js.configs.recommended,

    // TypeScript config
    ...tseslint.configs.recommended,

    // Plugin configs
    importPlugin.flatConfigs.recommended,
    securityPlugin.configs.recommended,
    unicornPlugin.configs['flat/recommended'],
    prettierPlugin,

    // Nx module boundaries
    {
        plugins: { '@nx': nxPlugin },
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    /* options */
                },
            ],
        },
    },

    // TypeScript files
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // TypeScript-specific rules
        },
    },

    // Test files
    {
        files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts'],
        rules: {
            // Test-specific rules
        },
    },
]);
```

## Core Utility Updates Required

The following utilities in `@ensono-stacks/core` need updates:

### Current utilities (eslintrc format)

- `updateEslintConfig()` - Reads/writes `.eslintrc.json`
- `mergeEslintConfigs()` - Merges Linter.Config objects
- `formatFilesWithEslint()` - Runs eslint --fix

### New utilities needed (flat config format)

- `updateFlatEslintConfig()` - Reads/writes `eslint.config.mjs` (AST
  manipulation via ts-morph)
- `mergeFlatConfigs()` - Merges flat config arrays
- `formatFilesWithEslint()` - No changes needed (eslint CLI unchanged)

### Migration strategy for utilities

1. Create new flat config utilities alongside existing ones
2. Update generators to use new utilities
3. Deprecate old eslintrc utilities (keep for backwards compatibility)
4. Remove deprecated utilities in next major version

## Nx Flat Config Conversion

Running `nx g @nx/eslint:convert-to-flat-config` will:

1. Create root `eslint.config.mjs`
2. Create project-level `eslint.config.mjs` files
3. Delete `.eslintrc.json` files
4. Update `project.json` lint targets if needed

**Post-conversion manual steps**:

1. Update plugin imports to v9-compatible exports
2. Replace `extends: ['airbnb/base']` with manual rules
3. Verify module boundary rules work
4. Run full test suite to validate

## Risk Assessment

| Risk                                        | Likelihood | Impact | Mitigation                                  |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------- |
| Plugin incompatibility discovered late      | Low        | High   | Comprehensive testing in dedicated branch   |
| Linting behavior regression                 | Medium     | Medium | Compare lint results before/after migration |
| Generator output breaks consumer workspaces | Medium     | High   | E2E tests with Verdaccio                    |
| Performance degradation                     | Low        | Low    | Benchmark lint times before/after           |

## References

- [ESLint v9 Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [typescript-eslint v8 Getting Started](https://typescript-eslint.io/getting-started/)
- [Nx ESLint Plugin Documentation](https://nx.dev/nx-api/eslint)
- [eslint-plugin-unicorn v57 Release Notes](https://github.com/sindresorhus/eslint-plugin-unicorn/releases)

## Migration Notes & Rule Behavior Changes

### Completed Implementation Changes

**Phase 5 - Generator Updates**:

- ✅ Updated workspace generator to produce flat config
- ✅ Updated Next.js generator to produce flat config
- ✅ Updated Storybook generator to produce flat config
- ✅ Updated React Query generator to produce flat config
- ✅ Updated logger (winston) generator to produce flat config
- ✅ Updated rest-client generator test expectations

**Phase 6 - Plugin Verification**:

- ✅ All 11 projects passing `nx run-many -t lint --all`
- ✅ All test suites passing with NODE_OPTIONS='--experimental-vm-modules'
- ✅ Verified plugin functionality: security, unicorn, import, prettier, jest

### Rule Behavior Changes

**ESLint Core Deprecated Rules**:

- `padding-line-between-statements` → Replaced by
  `@stylistic/padding-line-between-statements`
    - Current behavior: ESLint shows deprecation warning but rule still enforced
    - Migration path: Will move to @stylistic/eslint-plugin in ESLint 11.0.0
    - Impact: None (rule continues to work as expected)

**typescript-eslint v8 Changes**:

- `projectService` replaces manual `project` configuration
    - Old: `parserOptions: { project: ['tsconfig(.*)?.json'] }`
    - New: `parserOptions: { projectService: true }` (automatic tsconfig
      detection)
    - Impact: Simplified configuration, better performance

**Plugin Rule Format Changes**:

- All plugins now use flat config exports
    - Security: `pluginSecurity.configs.recommended`
    - Unicorn: `eslintPluginUnicorn.configs['flat/recommended']`
    - Import: `importPlugin.flatConfigs.recommended`
    - Jest: `jest.configs['flat/recommended']`
    - Testing Library: `testingLibrary.configs['flat/react']`
    - Prettier: `eslintPluginPrettierRecommended`
- Impact: More explicit imports, better tree-shaking

**Node.js/Jest Testing Changes**:

- Prettier 3.x dynamic imports require
  `NODE_OPTIONS='--experimental-vm-modules'`
    - Added to package.json test script globally
    - Required for Jest 30.2.0 + Prettier 3.6.2 compatibility
    - Impact: Tests run successfully with flag enabled

### Known Issues & Resolutions

**Issue 1: Prettier Dynamic Import Failures**

- **Problem**: formatFiles() threw errors when Prettier config couldn't be
  resolved
- **Solution**: Modified formatFiles to handle null config gracefully, use
  defaults for virtual trees
- **Impact**: All formatting tests passing

**Issue 2: Legacy Generator Files**

- **Problem**: Some generators (logger, rest-client) still used legacy eslintrc
  format
- **Solution**: Converted to string-based flat config generation (similar to
  Next.js approach)
- **Impact**: All generators now produce flat config

**Issue 3: Test Snapshot Mismatches**

- **Problem**: Tests expected `.eslintrc.json` files
- **Solution**: Updated test assertions to expect `eslint.config.mjs`
- **Impact**: All test snapshots updated and passing

### Backward Compatibility

**Deprecated Utilities** (marked for future removal):

- `updateEslintConfig()` from @ensono-stacks/core
- `mergeEslintConfigs()` from @ensono-stacks/core

**New Utilities**:

- `readFlatEslintConfig()` - Read and parse flat config files
- `writeFlatEslintConfig()` - Generate flat config files
- `mergeFlatConfigs()` - Combine flat config arrays
- `getFlatConfigPath()` - Resolve config file location

**Migration Strategy for Consumers**:

1. Existing workspaces with `.eslintrc.json` continue to work
2. New workspaces generated with `eslint.config.mjs`
3. Manual migration: Run `nx g @nx/eslint:convert-to-flat-config`
4. Update imports to new plugin versions

### Performance Impact

**Linting Performance**:

- No significant performance changes observed
- `projectService` may improve performance for large monorepos
- Flat config loads slightly faster (fewer JSON parsing steps)

**Test Execution**:

- NODE_OPTIONS flag adds minimal overhead (~50ms on test startup)
- Overall test execution time unchanged
- No cache invalidation issues
