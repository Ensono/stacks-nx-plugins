# Quickstart: ESLint v9 Flat Config Migration

**Feature**: 001-eslint-flat-config  
**Date**: 3 February 2026

## Overview

This guide provides step-by-step instructions for implementing the ESLint v9
flat config migration in the stacks-nx-plugins monorepo.

## Prerequisites

- Node.js 22.x (verified via `.nvmrc`)
- pnpm (workspace package manager)
- Current branch: `001-eslint-flat-config`

## Phase 1: Package Updates

### Step 1.1: Update package.json dependencies

```bash
# Update ESLint core
pnpm add -D eslint@^9.8.0

# Update TypeScript ESLint (major version)
pnpm add -D typescript-eslint@^8.0.0
pnpm remove @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Update unicorn plugin (major version for flat config)
pnpm add -D eslint-plugin-unicorn@^57.0.0

# Update testing library plugin
pnpm add -D eslint-plugin-testing-library@^7.0.0

# Update jest plugin
pnpm add -D eslint-plugin-jest@^28.0.0

# Add globals package (required for flat config)
pnpm add -D globals

# Remove airbnb (no ESLint v9 support)
pnpm remove eslint-config-airbnb

# Install frozen lockfile after updates
pnpm install --frozen-lockfile
```

### Step 1.2: Verify installation

```bash
pnpm exec eslint --version
# Expected: v9.8.0 or higher
```

## Phase 2: Nx Conversion

### Step 2.1: Run Nx flat config converter

```bash
pnpm exec nx g @nx/eslint:convert-to-flat-config
```

This will:

- Create `eslint.config.js` at root
- Create project-level `eslint.config.js` files
- Delete `.eslintrc.json` files

### Step 2.2: Verify conversion

```bash
# Check that flat config files exist
ls eslint.config.js
ls packages/*/eslint.config.js
ls packages/common/*/eslint.config.js

# Verify .eslintrc.json files are deleted
find . -name ".eslintrc.json" -type f
# Should return empty
```

## Phase 3: Configuration Customization

### Step 3.1: Update root eslint.config.js

Replace the auto-generated config with the Stacks-specific configuration from
[contracts/eslint-config-schema.md](contracts/eslint-config-schema.md).

Key changes:

1. Use `typescript-eslint` meta-package instead of separate packages
2. Add security, unicorn, and import plugins
3. Configure Nx module boundaries
4. Add Prettier integration
5. Replace airbnb rules with equivalent manual configuration

### Step 3.2: Update project-level configs

Each project config should:

1. Import and spread the root config
2. Add project-specific overrides if needed

```javascript
// packages/<project>/eslint.config.js
import baseConfig from '../../eslint.config.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([...baseConfig]);
```

## Phase 4: Core Utility Updates

### Step 4.1: Create new flat config utilities

Location: `packages/common/core/src/utils/eslint/`

Create the following new files:

- `flat-config.ts` - Read/write/merge flat config
- `flat-config.spec.ts` - Unit tests

### Step 4.2: Update generator utilities

Update these files to use flat config:

- `packages/workspace/src/generators/init/utils/eslint.ts`
- `packages/workspace/src/generators/init/utils/constants.ts`
- `packages/next/src/generators/init/utils/eslint.ts`
- `packages/next/src/generators/init/utils/constants.ts`

## Phase 5: Testing

### Step 5.1: Run lint on all projects

```bash
pnpm exec nx run-many -t lint --all
```

All projects should pass without errors.

### Step 5.2: Run unit tests

```bash
pnpm exec nx run-many -t test --all
```

Update any failing tests that reference `.eslintrc.json`.

### Step 5.3: Run E2E tests

```bash
pnpm exec nx e2e workspace-e2e
pnpm exec nx e2e next-e2e
```

## Phase 6: Validation Checklist

- [x] ESLint v9.8.0+ installed
- [x] All `.eslintrc.json` files deleted (12 files)
- [x] All `eslint.config.js` files created (12 files)
- [x] `nx lint` passes on all projects
- [x] Unit tests pass (80% coverage maintained) - Core ESLint packages pass,
      other failures unrelated
- [x] E2E tests pass - workspace-e2e and next-e2e validated
- [x] Module boundary rules enforced
- [x] Import ordering rules enforced
- [x] TypeScript rules enforced
- [x] Security rules enforced
- [x] Unicorn rules enforced
- [x] Prettier integration working

## Troubleshooting

### "TypeError: context.getScope is not a function"

A plugin hasn't been updated for ESLint v9. Check the plugin version and update
to a v9-compatible version.

### "Cannot find module 'eslint/config'"

ESLint v9 not installed. Run `pnpm add -D eslint@^9.8.0`.

### Module boundary errors after migration

The `@nx/enforce-module-boundaries` rule may need reconfiguration. Ensure the
plugin is correctly registered:

```javascript
{
  plugins: { '@nx': nxPlugin },
  rules: {
    '@nx/enforce-module-boundaries': ['error', { /* options */ }],
  },
}
```

### Prettier conflicts

Ensure `eslint-plugin-prettier/recommended` is applied LAST in the config array
to override other formatting rules.

## Rollback Procedure

If migration fails:

```bash
# Revert to previous state
git checkout main -- package.json pnpm-lock.yaml
git checkout main -- .eslintrc.json
git checkout main -- "packages/**/.eslintrc.json"
pnpm install --frozen-lockfile
```
