# Implementation Plan: Migrate from Jest to Vitest

**Branch**: `004-migrate-to-vitest` | **Date**: 5 February 2026 | **Spec**:
[spec.md](spec.md) **Input**: Feature specification from
`/specs/004-migrate-to-vitest/spec.md`

## Summary

Replace Jest with Vitest across all 19 projects in the Nx monorepo. Vitest
provides native ESM support (eliminating the need for
`--experimental-vm-modules`), has a Jest-compatible API for minimal test
changes, and integrates with Nx through the `@nx/vitest` plugin with inferred
task detection. The migration will follow Nx's recommended Vitest configuration
patterns to ensure proper monorepo integration.

## Technical Context

**Language/Version**: TypeScript ~5.8.0, Node.js 22.x  
**Primary Dependencies**: `@nx/vitest@22.4.4`, `vitest@^4.0.0`,
`@vitest/coverage-v8@^4.0.0`  
**Storage**: N/A (configuration files only)  
**Testing**: Vitest (replacing Jest 30.2.0)  
**Target Platform**: Node.js (library plugins) + JSDOM (React components)
**Project Type**: Nx monorepo with 19 test configurations  
**Performance Goals**: Test execution time equal to or faster than Jest  
**Constraints**: Must maintain 80% coverage threshold, 180s E2E timeout  
**Scale/Scope**: 10 library packages + 8 E2E projects + 1 root config

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Check ✅

| Principle                    | Status    | Notes                                                         |
| ---------------------------- | --------- | ------------------------------------------------------------- |
| I. Nx-Native Design          | ✅ PASS   | Using `@nx/vitest` with inferred tasks follows Nx conventions |
| II. Co-locate by Technology  | ✅ PASS   | No new plugins created, just updating existing test configs   |
| III. Opt-In Flexibility      | ✅ PASS   | Vitest is workspace tooling, not user-facing generator output |
| IV. Test-First Development   | ⚠️ N/A    | Migration of test infrastructure, not new features            |
| V. End-to-End Testing        | ✅ PASS   | E2E tests will be migrated to use Vitest                      |
| VI. Enterprise-Ready Quality | ✅ PASS   | Coverage thresholds and CI validation preserved               |
| VII. Single Source of Truth  | ✅ PASS   | Config stored in nx.json plugins array                        |
| VIII. Automated Formatting   | ✅ PASS   | ESLint/Prettier runs after changes                            |
| IX. Generator Parity         | ⚠️ REVIEW | If any generators produce Jest configs, they need updating    |

### Post-Design Check ✅

| Principle                    | Status  | Notes                                                                             |
| ---------------------------- | ------- | --------------------------------------------------------------------------------- |
| I. Nx-Native Design          | ✅ PASS | Plan uses `@nx/vitest` plugin with inferred tasks, `vitest.config.ts` per project |
| II. Co-locate by Technology  | ✅ PASS | Test configs remain co-located with their projects                                |
| III. Opt-In Flexibility      | ✅ PASS | No changes to user-facing generator output                                        |
| IV. Test-First Development   | ✅ PASS | Existing tests preserved, coverage thresholds enforced                            |
| V. End-to-End Testing        | ✅ PASS | E2E configs migrated with proper timeout settings                                 |
| VI. Enterprise-Ready Quality | ✅ PASS | 80% coverage thresholds maintained in `vitest.shared.ts`                          |
| VII. Single Source of Truth  | ✅ PASS | Shared config in `vitest.shared.ts`, plugin in `nx.json`                          |
| VIII. Automated Formatting   | ✅ PASS | `pnpm exec nx run-many -t lint --fix` after implementation                        |
| IX. Generator Parity         | ✅ PASS | Research confirmed no generators produce Jest configs                             |

**Generator Parity Resolved**: Verified that `@ensono-stacks/next` and other
generators do not scaffold Jest configurations for consumer workspaces.
Generators focus on application code; consumers manage their own test
infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/001-migrate-to-vitest/
├── plan.md              # This file
├── research.md          # Phase 0 output (Nx Vitest integration research)
├── quickstart.md        # Phase 1 output (migration guide)
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (repository root)

```text
# Files to REMOVE (Jest artifacts)
jest.config.ts                    # Root Jest config
jest.preset.js                    # Shared Jest preset
packages/*/jest.config.ts         # 10 package configs
e2e/*/jest.config.ts              # 8 E2E configs

# Files to CREATE (Vitest configuration)
vitest.workspace.ts               # Workspace file for monorepo config discovery
packages/*/vitest.config.mts      # 10 package configs (standalone)
e2e/*/vitest.config.mts           # 8 E2E configs (standalone)

# Files to MODIFY
package.json                      # Update dependencies
nx.json                           # Update plugins array (@nx/jest → @nx/vitest)
eslint.config.mjs                 # Replace jest globals with vitest
packages/*/project.json           # Remove explicit test targets (use inferred)
e2e/*/project.json                # Update e2e targets to use vitest

# Test files to UPDATE (jest.* → vi.*)
packages/playwright/src/generators/visual-regression/generator.spec.ts
packages/create/bin/create-stacks-workspace.spec.ts
packages/create/bin/dependencies.spec.ts
packages/azure-node/src/generators/app-insights/generator.spec.ts
packages/common/core/src/utils/*.spec.ts
```

**Structure Decision**: Nx monorepo configuration migration. Each project gets
its own `vitest.config.ts` following Nx conventions. The `@nx/vitest` plugin
will auto-detect these configs and create inferred `test` targets.

## Complexity Tracking

No constitution violations requiring justification. This is a tooling migration
that aligns with Nx-Native Design (Principle I).
