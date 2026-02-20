# Implementation Plan: ESLint v9 Flat Config Migration

**Branch**: `003-eslint-flat-config` | **Date**: 3 February 2026 | **Spec**:
[spec.md](spec.md) **Input**: Feature specification from
`/specs/003-eslint-flat-config/spec.md`

## Summary

Migrate ESLint from v8.57.0 to v9.8.0+ with flat config format
(`eslint.config.mjs`) across the stacks-nx-plugins monorepo and update all
generators to produce flat config for consumer workspaces. This requires
updating 12 `.eslintrc.json` files, upgrading ESLint plugins to v9-compatible
versions, updating core utilities in `@ensono-stacks/core`, and modifying
generators in `@ensono-stacks/workspace` and `@ensono-stacks/next`.

## Technical Context

**Language/Version**: TypeScript ~5.8.0, Node.js 24.x (verified via `.nvmrc`)  
**Primary Dependencies**:

- ESLint: ~8.57.0 → ^9.8.0
- @typescript-eslint/\*: 7.18.0 → ^8.0.0
- @nx/eslint: 22.4.4 (already supports flat config)
- eslint-plugin-unicorn: 56.0.1 → ^57.0.0 (requires ESLint 9.20.0+)
- eslint-config-airbnb: 19.0.4 → **BLOCKED** (no ESLint v9 support)

**Storage**: N/A  
**Testing**: Jest with 80% coverage threshold (jest.preset.js)  
**Target Platform**: Nx 22.x monorepo plugin development  
**Project Type**: Nx monorepo with publishable plugins  
**Performance Goals**: Linting should complete in comparable time to ESLint v8  
**Constraints**: Must maintain feature parity with existing linting rules  
**Scale/Scope**: 12 .eslintrc.json files to migrate, 2 generators to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status  | Notes                                                                                       |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| I. Nx-Native Design             | ✅ PASS | Using `@nx/eslint` and its flat config support via `nx g @nx/eslint:convert-to-flat-config` |
| II. Co-locate by Technology     | ✅ PASS | ESLint utilities remain in `@ensono-stacks/core`                                            |
| III. Opt-In Flexibility         | ✅ PASS | Generators still use schema options for ESLint enablement                                   |
| IV. Test-First Development      | ✅ PASS | Will create baseline branches and write tests from diffs                                    |
| V. End-to-End Testing           | ✅ PASS | E2E tests will verify flat config generation in consumer workspaces                         |
| VI. Enterprise-Ready Quality    | ✅ PASS | Proper validation and error handling maintained                                             |
| VII. Single Source of Truth     | ✅ PASS | ESLint config utilities centralized in `@ensono-stacks/core`                                |
| VIII. Automated Formatting Only | ✅ PASS | All formatting via `nx lint --fix`                                                          |
| IX. Generator Parity            | ✅ PASS | Generators updated to produce flat config matching monorepo patterns                        |

**Critical Dependency Issue**: `eslint-config-airbnb` does NOT support ESLint
v9. This requires either:

- Option A: Remove airbnb and manually configure equivalent rules
- Option B: Use `@eslint/eslintrc` FlatCompat to wrap airbnb config (not
  recommended for long-term)

**Decision**: Proceed with Option A - remove airbnb dependency and configure
equivalent rules manually. This provides cleaner flat config and removes
external dependency risk.

## Project Structure

### Documentation (this feature)

```text
specs/001-eslint-flat-config/
├── plan.md              # This file
├── research.md          # Phase 0 output - plugin compatibility research
├── data-model.md        # Phase 1 output - ESLint config entity model
├── quickstart.md        # Phase 1 output - migration guide
├── contracts/           # Phase 1 output - config schemas
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (affected files)

```text
# Root-level changes
eslint.config.mjs                    # NEW - replaces .eslintrc.json
.eslintrc.json                      # DELETE

# Package-level changes (11 packages)
packages/azure-node/eslint.config.mjs    # NEW
packages/azure-node/.eslintrc.json      # DELETE
packages/azure-react/eslint.config.mjs   # NEW
packages/azure-react/.eslintrc.json     # DELETE
packages/common/core/eslint.config.mjs   # NEW
packages/common/core/.eslintrc.json     # DELETE
packages/common/e2e/eslint.config.mjs    # NEW
packages/common/e2e/.eslintrc.json      # DELETE
packages/common/test/eslint.config.mjs   # NEW
packages/common/test/.eslintrc.json     # DELETE
packages/create/eslint.config.mjs        # NEW
packages/create/.eslintrc.json          # DELETE
packages/logger/eslint.config.mjs        # NEW
packages/logger/.eslintrc.json          # DELETE
packages/next/eslint.config.mjs          # NEW
packages/next/.eslintrc.json            # DELETE
packages/playwright/eslint.config.mjs    # NEW
packages/playwright/.eslintrc.json      # DELETE
packages/rest-client/eslint.config.mjs   # NEW
packages/rest-client/.eslintrc.json     # DELETE
packages/workspace/eslint.config.mjs     # NEW
packages/workspace/.eslintrc.json       # DELETE

# Core utility updates
packages/common/core/src/utils/eslint/  # Update flat config utilities

# Generator updates
packages/workspace/src/generators/init/utils/eslint.ts
packages/workspace/src/generators/init/utils/constants.ts
packages/next/src/generators/init/utils/eslint.ts
packages/next/src/generators/init/utils/constants.ts

# Test updates
packages/workspace/src/generators/init/generator.spec.ts
packages/next/src/generators/init/generator.spec.ts
e2e/workspace-e2e/tests/*.spec.ts
e2e/next-e2e/tests/*.spec.ts
```

**Structure Decision**: This is an Nx monorepo with existing plugin structure.
No new packages are created; changes are modifications to existing packages
following established patterns.

## Complexity Tracking

| Violation                                    | Why Needed                           | Simpler Alternative Rejected Because                      |
| -------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Remove eslint-config-airbnb                  | ESLint v9 not supported by airbnb    | FlatCompat wrapper adds complexity and maintenance burden |
| Major version bump for @typescript-eslint    | Required for ESLint v9 compatibility | v7.x does not support ESLint v9                           |
| Major version bump for eslint-plugin-unicorn | Required for flat config             | v56.x only supports legacy config format                  |

## Constitution Check - Post-Design Re-evaluation

_Re-checked after Phase 1 design completion._

| Principle                       | Status  | Post-Design Notes                                                      |
| ------------------------------- | ------- | ---------------------------------------------------------------------- |
| I. Nx-Native Design             | ✅ PASS | Design uses `nx g @nx/eslint:convert-to-flat-config` as starting point |
| II. Co-locate by Technology     | ✅ PASS | New utilities in `@ensono-stacks/core` follow existing patterns        |
| III. Opt-In Flexibility         | ✅ PASS | Generator schemas unchanged; ESLint still opt-in via `--eslint` flag   |
| IV. Test-First Development      | ✅ PASS | Quickstart defines test phases; E2E tests specified                    |
| V. End-to-End Testing           | ✅ PASS | E2E tests for workspace-e2e and next-e2e included in scope             |
| VI. Enterprise-Ready Quality    | ✅ PASS | Error handling patterns defined in quickstart troubleshooting          |
| VII. Single Source of Truth     | ✅ PASS | Config schemas in contracts/ define single source of truth             |
| VIII. Automated Formatting Only | ✅ PASS | All formatting via `nx lint --fix`; no manual formatting               |
| IX. Generator Parity            | ✅ PASS | Generators produce flat config matching monorepo patterns              |

**All gates pass. Ready for Phase 2 task breakdown.**

## Generated Artifacts

| Artifact      | Path                                                                   | Description                                  |
| ------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| Research      | [research.md](research.md)                                             | Plugin compatibility matrix and decision log |
| Data Model    | [data-model.md](data-model.md)                                         | ESLint config entities and relationships     |
| Config Schema | [contracts/eslint-config-schema.md](contracts/eslint-config-schema.md) | Generated config structure                   |
| Quickstart    | [quickstart.md](quickstart.md)                                         | Step-by-step migration guide                 |

## Next Steps

Run `/speckit.tasks` to generate the task breakdown for implementation.
