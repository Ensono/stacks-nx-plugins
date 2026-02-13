# Implementation Plan: Vite Build Executor with Centralised Dependency Versions

**Branch**: `001-vite-build-executor` | **Date**: 9 February 2026 | **Spec**:
[spec.md](spec.md) **Input**: Feature specification from
`/specs/001-vite-build-executor/spec.md`

## Summary

Migrate all 10 package build targets from `@nx/js:tsc` to `@nx/vite` inferred
tasks. Create a central version registry (`tools/versions.ts`) mapping npm
package names to semver strings. Use Vite's `define` configuration to replace
`__versions__.*` globals with literal version strings at build time. This
eliminates 60+ hardcoded version constants scattered across 12 files in 8
packages, creating a single source of truth that Dependabot can scan for
security advisories.

## Technical Context

**Language/Version**: TypeScript ~5.8.0 on Node.js 22.16.0  
**Primary Dependencies**: `@nx/vite` 22.4.4, `vite` ^7.0.0, `vite-plugin-dts`,
`@nx/devkit` 22.4.4  
**Storage**: N/A (build tooling only)  
**Testing**: Vitest ^4.0.18 (existing, no changes needed)  
**Target Platform**: npm-published Nx plugins (Node.js library packages)  
**Project Type**: Monorepo (Nx workspace with 10 buildable packages)  
**Performance Goals**: Full monorepo build time within 20% of current baseline  
**Constraints**: Must preserve identical build output structure (JS, `.d.ts`,
assets)  
**Scale/Scope**: 10 packages, 12 version files, ~60 version constants

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status | Notes                                                                        |
| ------------------------------- | ------ | ---------------------------------------------------------------------------- |
| I. Nx-Native Design             | PASS   | Using `@nx/vite` inferred tasks — the recommended Nx pattern                 |
| II. Co-locate by Technology     | PASS   | No new packages created; tooling change only                                 |
| III. Opt-In Flexibility         | PASS   | No generator API changes; internal build tooling only                        |
| IV. Test-First Development      | PASS   | Existing unit tests validate behaviour; new tests for `toVersionKey` utility |
| V. End-to-End Testing           | PASS   | Existing E2E tests verify published package functionality                    |
| VI. Enterprise-Ready Quality    | PASS   | Build fails on missing version entries; clear error messages                 |
| VII. Single Source of Truth     | PASS   | Central `tools/versions.ts` replaces 12 scattered files                      |
| VIII. Automated Formatting Only | PASS   | Will run `nx run-many -t lint --fix` after changes                           |
| IX. Generator Parity            | PASS   | Generator output unchanged; only build tooling changes                       |

**Post-Phase 1 re-check**: All gates still PASS. The design uses standard
Nx/Vite patterns, centralises configuration, and preserves all external-facing
behaviour.

## Project Structure

### Documentation (this feature)

```text
specs/001-vite-build-executor/
├── plan.md              # This file
├── research.md          # Phase 0: Nx Vite docs, define config, plugin analysis
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Developer guide
├── contracts/           # Phase 1: API contracts
│   ├── version-transform.md
│   └── vite-build-config.md
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2: Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
tools/
├── versions.ts              # NEW: Central version registry + toVersionKey + buildVersionDefineMap
└── versions.d.ts            # NEW: TypeScript declarations for __versions__ globals

packages/<each-package>/
├── vite.config.ts           # NEW: Vite library build config with define map
├── vitest.config.mts        # EXISTING: Unchanged (test config)
├── project.json             # MODIFIED: Remove explicit build target
└── src/
    └── ...                  # MODIFIED: Replace version imports with __versions__.* references

nx.json                      # MODIFIED: Add @nx/vite plugin, adjust @nx/js/typescript
package.json                 # MODIFIED: Add generator deps to devDependencies
```

**Structure Decision**: Existing monorepo structure preserved. New files are
`tools/versions.ts`, `tools/versions.d.ts`, and one `vite.config.ts` per
buildable package. No new packages or directories.

## Detailed Implementation

### Phase A: Central Version Infrastructure

#### A1. Create `tools/versions.ts`

Create the central version registry with all 60+ version constants migrated from
12 source files.

**File**: `tools/versions.ts`

```typescript
/**
 * Central registry of dependency versions installed by generators.
 *
 * These versions are replaced at build time via Vite's `define` config.
 * Each package's vite.config.ts calls buildVersionDefineMap() to produce
 * the replacement map.
 *
 * IMPORTANT: Every package listed here MUST also appear in the root
 * package.json devDependencies at the same version, so Dependabot can scan them.
 */

export const generatorDependencyVersions: Record<string, string> = {
    // ── Workspace: commitlint / commitizen / husky ──
    husky: '^9.1.7',
    '@commitlint/cli': '19.3.0',
    '@commitlint/config-conventional': '19.2.2',
    '@commitlint/config-nx-scopes': '19.3.1',
    '@commitlint/cz-commitlint': '19.2.0',
    commitizen: '^4.3.0',

    // ── Workspace: formatting / linting ──
    prettier: '2.8.8',
    eslint: '^9.8.0',
    'typescript-eslint': '^8.54.0',
    'eslint-config-prettier': '10.1.5',
    'eslint-import-resolver-typescript': '4.4.1',
    'eslint-plugin-compat': '6.0.2',
    'eslint-plugin-import': '2.31.0',
    'eslint-plugin-jsx-a11y': '6.10.2',
    'eslint-plugin-prettier': '5.5.5',
    'eslint-plugin-security': '3.0.1',
    'eslint-plugin-unicorn': '^57.0.0',
    'eslint-plugin-jest': '28.11.1',
    'eslint-plugin-jest-dom': '5.5.0',
    'eslint-plugin-no-unsanitized': '4.1.2',
    globals: '^15.0.0',
    'lint-staged': '16.1.0',

    // ── Next.js: init ──
    'eslint-plugin-testing-library': '^7.0.0',
    '@next/eslint-plugin-next': '^15.1.6',
    express: '4.19.2',
    '@types/express': '4.17.21',

    // ── Next.js: auth ──
    'next-auth': '5.0.0-beta.28',
    '@auth/core': '0.39.1',
    oauth4webapi: '^3.3.0',
    ioredis: '5.4.1',
    uuid: '9.0.1',
    '@types/uuid': '9.0.8',

    // ── Next.js: react-query ──
    '@tanstack/react-query': '5.90.20',
    '@tanstack/eslint-plugin-query': '5.91.4',

    // ── Next.js: CI/CD / deployment ──
    '@nx-tools/nx-container': '5.3.1',
    '@nx-tools/nx-metadata': '5.3.1',
    '@jscutlery/semver': '5.2.2',
    '@axe-core/react': '^4.9.0',

    // ── Next.js: storybook ──
    '@storybook/nextjs': '8.6.14',
    '@storybook/addon-links': '8.6.14',
    '@storybook/manager-api': '8.6.14',
    '@storybook/preview-api': '8.6.14',
    '@storybook/addon-a11y': '8.6.14',
    '@storybook/addon-actions': '8.6.14',
    '@storybook/addon-jest': '8.6.14',
    '@storybook/theming': '8.6.14',
    '@storybook/core-server': '8.6.14',
    '@storybook/addon-essentials': '8.6.14',
    '@storybook/addon-interactions': '8.6.14',
    'eslint-plugin-storybook': '0.12.0',

    // ── Logger ──
    winston: '3.13.0',

    // ── Rest client ──
    axios: '1.7.7',
    orval: '6.28.2',
    msw: '2.2.14',
    '@faker-js/faker': '8.4.1',
    zod: '3.23.4',

    // ── Azure Node ──
    applicationinsights: '3.1.0',

    // ── Azure React ──
    '@microsoft/applicationinsights-web': '3.2.1',
    '@microsoft/applicationinsights-react-js': '17.2.0',

    // ── Playwright ──
    '@axe-core/playwright': '4.9.0',
    'axe-result-pretty-print': '1.0.2',
    '@applitools/eyes-playwright': '1.27.2',
    '@playwright/test': '^1.44.0',
};

/**
 * Transform an npm package name into a valid __versions__ property key.
 *
 * Rules:
 * 1. Strip leading @
 * 2. Replace / with $
 * 3. Replace - and . with _
 *
 * @example toVersionKey('@tanstack/react-query') => '__versions__.tanstack$react_query'
 * @example toVersionKey('axios') => '__versions__.axios'
 */
export function toVersionKey(packageName: string): string {
    return (
        '__versions__.' +
        packageName.replace(/^@/, '').replace(/\//g, '$').replace(/[-\.]/g, '_')
    );
}

/**
 * Build the Vite `define` map for version replacement.
 *
 * Returns a Record where keys are __versions__.* expressions
 * and values are JSON.stringify'd version strings.
 */
export function buildVersionDefineMap(): Record<string, string> {
    const defineMap: Record<string, string> = {};
    for (const [pkg, version] of Object.entries(generatorDependencyVersions)) {
        defineMap[toVersionKey(pkg)] = JSON.stringify(version);
    }
    return defineMap;
}
```

#### A2. Create `tools/versions.d.ts`

TypeScript declaration for the `__versions__` global namespace so source code
can reference `__versions__.*` without type errors.

**File**: `tools/versions.d.ts`

```typescript
/**
 * Global namespace for build-time version constants.
 *
 * Values are replaced by Vite's `define` config during build.
 * At runtime in compiled output, these are literal strings.
 *
 * Access pattern: __versions__.<transformed_package_name>
 * Transform: strip @, replace / with $, replace - and . with _
 */
declare const __versions__: {
    readonly [key: string]: string;
};
```

This file must be referenced in `tsconfig.base.json` via `"include"` or
`"files"`.

#### A3. Add generator dependencies to root `package.json`

Add every entry from `generatorDependencyVersions` to the root `package.json`
`devDependencies` section. This enables Dependabot scanning.

**Version conflict rule**: If a dependency already exists in the root
`package.json` with a different version, the root `package.json` version is
authoritative — update `tools/versions.ts` to match. If the dependency is
missing from the root, add it using the version from the plugin's existing
constant.

### Phase B: Nx Configuration Changes

#### B1. Register `@nx/vite` plugin in `nx.json`

Add to the plugins array:

```json
{
    "plugin": "@nx/vite",
    "include": ["packages/**/*"],
    "exclude": ["e2e/**/*"],
    "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "ciTargetName": "test-ci"
    }
}
```

#### B2. Update `@nx/js/typescript` plugin registration

Remove the `build` section to prevent conflict with Vite's inferred build:

```json
{
    "plugin": "@nx/js/typescript",
    "options": {
        "typecheck": {
            "targetName": "typecheck"
        }
    }
}
```

#### B3. Remove existing `@nx/vitest` plugin registrations

The `@nx/vite` plugin handles both vitest and vite config detection. Remove both
`@nx/vitest` entries and let `@nx/vite` infer test targets from
`vitest.config.mts` and build targets from `vite.config.ts`.

Alternatively, if test target options need to differ between packages and e2e,
keep `@nx/vitest` for e2e only:

```json
{
  "plugin": "@nx/vite",
  "include": ["packages/**/*"],
  "options": {
    "buildTargetName": "build",
    "testTargetName": "test",
    "ciTargetName": "test-ci"
  }
},
{
  "plugin": "@nx/vitest",
  "include": ["e2e/**/*"],
  "options": {
    "testTargetName": "e2e",
    "ciTargetName": "e2e-ci"
  }
}
```

#### B4. Remove `@nx/js:tsc` target defaults

The `targetDefaults` entry for `@nx/js:tsc` in `nx.json` is no longer needed:

```json
// REMOVE this block:
"@nx/js:tsc": {
  "cache": true,
  "dependsOn": ["^build"],
  "inputs": ["production", "^production"]
}
```

The `build` target defaults (already present) cover the Vite-inferred build
target.

### Phase C: Per-Package Vite Configuration

#### C1. Add `vite.config.ts` to each buildable package

Create 10 `vite.config.ts` files (one per buildable package):

| Package       | Path                                  |
| ------------- | ------------------------------------- |
| `next`        | `packages/next/vite.config.ts`        |
| `workspace`   | `packages/workspace/vite.config.ts`   |
| `logger`      | `packages/logger/vite.config.ts`      |
| `rest-client` | `packages/rest-client/vite.config.ts` |
| `playwright`  | `packages/playwright/vite.config.ts`  |
| `azure-node`  | `packages/azure-node/vite.config.ts`  |
| `azure-react` | `packages/azure-react/vite.config.ts` |
| `create`      | `packages/create/vite.config.ts`      |
| `common/core` | `packages/common/core/vite.config.ts` |
| `common/test` | `packages/common/test/vite.config.ts` |

**Note**: `packages/common/e2e` does NOT get a vite.config.ts — it has no build
target.

**Template** (for standard packages):

```typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { buildVersionDefineMap } from '../../tools/versions';

export default defineConfig(() => ({
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/packages/<name>',

    plugins: [
        nxViteTsPaths(),
        nxCopyAssetsPlugin(['*.md', '*.json', '*.ejs', '**/*.d.ts']),
        dts({
            entryRoot: 'src',
            tsconfigPath: './tsconfig.lib.json',
        }),
    ],

    define: buildVersionDefineMap(),

    build: {
        outDir: 'dist',
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs'],
            fileName: 'index',
        },
        rollupOptions: {
            external: [/node_modules/, /^@nx\//, /^@ensono-stacks\//],
        },
    },
}));
```

For `packages/common/core`, `packages/common/test`: use
`../../../tools/versions` import path.

#### C2. Remove explicit build targets from `project.json` files

Remove the `"build": { "executor": "@nx/js:tsc", ... }` block from all 10
`project.json` files.

### Phase D: Migrate Version Constants

#### D1. Replace hardcoded version constants with `__versions__.*` references

For each of the 12 version/constants files, replace the exported version string
constants with `__versions__.*` references.

**Before** (e.g., `packages/rest-client/src/utils/versions.ts`):

```typescript
export const AXIOS_VERSION = '1.7.7';
export const ORVAL_VERSION = '6.28.2';
```

**After**:

```typescript
export const AXIOS_VERSION = __versions__.axios;
export const ORVAL_VERSION = __versions__.orval;
```

**Full mapping** for each file (see
[contracts/version-transform.md](contracts/version-transform.md) for the
transform rules):

| File                          | Constant                                 | `__versions__` reference                              |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| workspace/init/constants.ts   | `HUSKY_VERSION`                          | `__versions__.husky`                                  |
| workspace/init/constants.ts   | `COMMITLINT_CLI_VERSION`                 | `__versions__.commitlint$cli`                         |
| workspace/init/constants.ts   | `COMMITLINT_CONFIG_CONVENTIONAL_VERSION` | `__versions__.commitlint$config_conventional`         |
| workspace/init/constants.ts   | `COMMITLINT_CONFIG_NX_SCOPES_VERSION`    | `__versions__.commitlint$config_nx_scopes`            |
| workspace/init/constants.ts   | `COMMITLINT_CZ_COMMITLINT_VERSION`       | `__versions__.commitlint$cz_commitlint`               |
| workspace/init/constants.ts   | `COMMITIZEN_VERSION`                     | `__versions__.commitizen`                             |
| workspace/init/constants.ts   | `PRETTIER_VERSION`                       | `__versions__.prettier`                               |
| workspace/init/constants.ts   | `ESLINT_VERSION`                         | `__versions__.eslint`                                 |
| workspace/init/constants.ts   | `TYPESCRIPT_ESLINT_VERSION`              | `__versions__.typescript_eslint`                      |
| workspace/init/constants.ts   | `ESLINT_CONFIG_PRETTIER_VERSION`         | `__versions__.eslint_config_prettier`                 |
| workspace/init/constants.ts   | `ESLINT_IMPORT_RESOLVER_TS_VERSION`      | `__versions__.eslint_import_resolver_typescript`      |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_COMPAT_VERSION`           | `__versions__.eslint_plugin_compat`                   |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_IMPORT_VERSION`           | `__versions__.eslint_plugin_import`                   |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_JSX_A11Y_VERSION`         | `__versions__.eslint_plugin_jsx_a11y`                 |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_PRETTIER_VERSION`         | `__versions__.eslint_plugin_prettier`                 |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_SECURITY_VERSION`         | `__versions__.eslint_plugin_security`                 |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_UNICORN_VERSION`          | `__versions__.eslint_plugin_unicorn`                  |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_JEST`                     | `__versions__.eslint_plugin_jest`                     |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_JEST_DOM`                 | `__versions__.eslint_plugin_jest_dom`                 |
| workspace/init/constants.ts   | `ESLINT_PLUGIN_NO_UNSANITIZED`           | `__versions__.eslint_plugin_no_unsanitized`           |
| workspace/init/constants.ts   | `GLOBALS_VERSION`                        | `__versions__.globals`                                |
| workspace/init/constants.ts   | `LINT_STAGED_VERSION`                    | `__versions__.lint_staged`                            |
| next/auth/constants.ts        | `NEXT_AUTH_VERSION`                      | `__versions__.next_auth`                              |
| next/auth/constants.ts        | `AUTH_CORE_VERSION`                      | `__versions__.auth$core`                              |
| next/auth/constants.ts        | `OAUTH_4_WEBAPI_VERSION`                 | `__versions__.oauth4webapi`                           |
| next/auth/constants.ts        | `IOREDIS_VERSION`                        | `__versions__.ioredis`                                |
| next/auth/constants.ts        | `UUID_VERSION`                           | `__versions__.uuid`                                   |
| next/auth/constants.ts        | `TYPES_UUID_VERSION`                     | `__versions__.types$uuid`                             |
| next/react-query/constants.ts | `REACT_QUERY_VERSION`                    | `__versions__.tanstack$react_query`                   |
| next/react-query/constants.ts | `REACT_QUERY_ESLINT_VERSION`             | `__versions__.tanstack$eslint_plugin_query`           |
| next/utils/constants.ts       | `NXTOOLS_NX_CONTAINER_VERSION`           | `__versions__.nx_tools$nx_container`                  |
| next/utils/constants.ts       | `NXTOOLS_NX_METADATA_VERSION`            | `__versions__.nx_tools$nx_metadata`                   |
| next/utils/constants.ts       | `JSCUTLERY_SEMVER_VERSION`               | `__versions__.jscutlery$semver`                       |
| next/utils/constants.ts       | `REACT_AXE_CORE_VERSION`                 | `__versions__.axe_core$react`                         |
| next/init/constants.ts        | `ESLINT_PLUGIN_TESTING_LIBRARY_VERSION`  | `__versions__.eslint_plugin_testing_library`          |
| next/init/constants.ts        | `NEXT_ESLINT_PLUGIN_VERSION`             | `__versions__.next$eslint_plugin_next`                |
| next/init/constants.ts        | `EXPRESS_VERSION`                        | `__versions__.express`                                |
| next/init/constants.ts        | `TYPES_EXPRESS_VERSION`                  | `__versions__.types$express`                          |
| next/storybook/constants.ts   | `NEXTJS_STORYBOOK_VERSION`               | `__versions__.storybook$nextjs`                       |
| next/storybook/constants.ts   | `ADDON_LINKS_STORYBOOK_VERSION`          | `__versions__.storybook$addon_links`                  |
| next/storybook/constants.ts   | `MANAGER_API_STORYBOOK_VERSION`          | `__versions__.storybook$manager_api`                  |
| next/storybook/constants.ts   | `PREVIEW_API_STORYBOOK_VERSION`          | `__versions__.storybook$preview_api`                  |
| next/storybook/constants.ts   | `ADDON_A11Y_STORYBOOK_VERSION`           | `__versions__.storybook$addon_a11y`                   |
| next/storybook/constants.ts   | `ADDON_ACTIONS_STORYBOOK_VERSION`        | `__versions__.storybook$addon_actions`                |
| next/storybook/constants.ts   | `ADDON_JEST_STORYBOOK_VERSION`           | `__versions__.storybook$addon_jest`                   |
| next/storybook/constants.ts   | `THEMING_STORYBOOK_VERSION`              | `__versions__.storybook$theming`                      |
| next/storybook/constants.ts   | `ESLINT_STORYBOOK_VERSION`               | `__versions__.eslint_plugin_storybook`                |
| next/storybook/constants.ts   | `CORE_SERVER_STORYBOOK_VERSION`          | `__versions__.storybook$core_server`                  |
| next/storybook/constants.ts   | `ADDON_ESSENTIALS_STORYBOOK_VERSION`     | `__versions__.storybook$addon_essentials`             |
| next/storybook/constants.ts   | `ADDON_INTERACTIONS_VERSION`             | `__versions__.storybook$addon_interactions`           |
| logger/winston/version.ts     | `WINSTON_VERSION`                        | `__versions__.winston`                                |
| rest-client/versions.ts       | `AXIOS_VERSION`                          | `__versions__.axios`                                  |
| rest-client/versions.ts       | `ORVAL_VERSION`                          | `__versions__.orval`                                  |
| rest-client/versions.ts       | `MSW_VERSION`                            | `__versions__.msw`                                    |
| rest-client/versions.ts       | `FAKERJS_VERSION`                        | `__versions__.faker_js$faker`                         |
| rest-client/versions.ts       | `ZOD_VERSION`                            | `__versions__.zod`                                    |
| azure-node/versions.ts        | `appInsightsVersion`                     | `__versions__.applicationinsights`                    |
| azure-react/versions.ts       | `appInsightsWebVersion`                  | `__versions__.microsoft$applicationinsights_web`      |
| azure-react/versions.ts       | `appInsightsReactVersion`                | `__versions__.microsoft$applicationinsights_react_js` |
| playwright/versions.ts        | `AXE_CORE_PLAYWRIGHT_VERSION`            | `__versions__.axe_core$playwright`                    |
| playwright/versions.ts        | `AXE_RESULTS_PRETTY_PRINT_VERSION`       | `__versions__.axe_result_pretty_print`                |
| playwright/versions.ts        | `APPLITOOLS_EYES_PLAYWRIGHT_VERSION`     | `__versions__.applitools$eyes_playwright`             |
| playwright/versions.ts        | `PLAYWRIGHT_VERSION`                     | `__versions__.playwright$test`                        |

**Non-version constants** (e.g., `PACKAGE_JSON`, `REACT_QUERY_NPM_PACKAGE_NAME`,
`NODE_LTS`, `NX_VERSION_SCOPE`) remain as hardcoded strings — they are not npm
dependency versions.

#### D2. Handle duplicate constants across logger eslint versions

The `logger/winston/version.ts` file has its own
`ESLINT_PLUGIN_TESTING_LIBRARY_VERSION` and `TYPESCRIPT_ESLINT_*` versions that
differ from the workspace-level versions. Since the root `package.json` is the
authoritative source, check whether these packages already exist in root
devDependencies:

- If present in root: use the root version in `generatorDependencyVersions`
  (source wins).
- If absent from root: add the logger-specific version to both
  `tools/versions.ts` and root `package.json`.

If the logger generator intentionally needs a _different_ version from the
workspace, it must manage that version outside the central registry (e.g., as a
hardcoded constant that is not replaced via `__versions__`).

### Phase E: Dependency & Configuration Cleanup

#### E1. Add `vite-plugin-dts` to root `package.json` devDependencies

```bash
pnpm add -D vite-plugin-dts
```

#### E2. Update `tsconfig.base.json`

Add `tools/versions.d.ts` to the `include` or `files` array so TypeScript
recognizes the `__versions__` global:

```json
{
  "compilerOptions": { ... },
  "include": ["tools/versions.d.ts"]
}
```

Or add to each `tsconfig.lib.json`:

```json
{
    "include": ["src/**/*.ts", "../../tools/versions.d.ts"]
}
```

#### E3. Update `vitest.config.mts` files (test-time define)

During testing (not build), `__versions__.*` references need to resolve.
Options:

1. **Use `vitest.config.mts` `define`**: Add `buildVersionDefineMap()` to each
   vitest config
2. **Use `globals` setup**: Mock `__versions__` in test setup files

Option 1 is simpler — add to each `vitest.config.mts`:

```typescript
import { buildVersionDefineMap } from '../../tools/versions';

export default defineConfig(() => ({
    // ... existing config
    define: buildVersionDefineMap(),
}));
```

### Phase F: Validation & Testing

#### F1. Build all packages

```bash
pnpm exec nx run-many -t build --all --parallel 8
```

#### F2. Verify version replacement in output

```bash
# Should find NO __versions__ references in compiled output
grep -r '__versions__' packages/*/dist/ && echo "FAIL: unreplaced references" || echo "PASS"

# Should find literal version strings
grep -r '"1.7.7"' packages/rest-client/dist/ && echo "PASS: versions inlined"
```

#### F3. Run all unit tests

```bash
pnpm exec nx run-many -t test --all --parallel 8
```

#### F4. Run affected E2E tests

```bash
pnpm exec nx affected -t e2e
```

#### F5. Verify Nx graph

```bash
pnpm exec nx graph
# Confirm build targets are correctly inferred for all packages
pnpm exec nx show project next --web
```

## Risk Mitigation

| Risk                                           | Mitigation                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Vite build output differs from tsc             | Compare `dist/` directory trees before/after migration; snapshot test critical files           |
| `vite-plugin-dts` slower than native tsc       | Use `skipDiagnostics: true` for faster builds; typecheck target handles diagnostics separately |
| `define` replacement misses deeply nested code | Grep for unreplaced `__versions__` in build output; fail CI if found                           |
| Plugin order conflict in nx.json               | Test `nx show project <name>` to verify correct build executor is inferred                     |
| Test-time `__versions__` not defined           | Add `define: buildVersionDefineMap()` to vitest configs                                        |
| CJS/ESM format mismatch                        | Use `formats: ['cjs']` to match existing output; verify `require()` works in E2E               |

## Complexity Tracking

No constitution violations to justify. All design decisions use standard Nx/Vite
patterns with no complexity beyond the necessary migration scope.
