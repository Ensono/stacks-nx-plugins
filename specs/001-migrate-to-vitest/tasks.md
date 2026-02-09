# Tasks: Migrate from Jest to Vitest

**Input**: Design documents from `/specs/001-migrate-to-vitest/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: No test tasks included - this is a test infrastructure migration, not
a feature implementation.

**Organization**: Tasks organized by migration phase. User Stories 1 & 2 (P1)
are combined as they share the same implementation. User Story 3 (P2 - E2E)
follows. User Story 4 (P3 - Watch Mode) is achieved via configuration.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1/2]**: Unit test execution (Stories 1 & 2)
- **[US3]**: E2E test execution (Story 3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & Workspace Config)

**Purpose**: Install Vitest packages and create workspace-level configuration

- [x] T001 Remove Jest dependencies from package.json (`@nx/jest`,
      `@types/jest`, `jest`, `jest-environment-jsdom`, `jest-environment-node`,
      `jest-util`, `ts-jest`, `eslint-plugin-jest`)
- [x] T002 Add Vitest dependencies to package.json (`@nx/vitest@22.4.4`,
      `@nx/vite@22.4.4`, `vitest`, `@vitest/coverage-v8`)
- [x] T003 Run `pnpm install` to update lockfile
- [x] T004 Create vitest.workspace.ts at workspace root
- [x] T005 Update nx.json to replace `@nx/jest/plugin` with `@nx/vitest` plugin
      configuration (two instances: one for packages, one for e2e)
- [x] T006 Remove `@nx/jest:jest` from targetDefaults in nx.json
- [x] T007 Update package.json scripts to remove
      `NODE_OPTIONS='--experimental-vm-modules'` from test script

---

## Phase 2: ESLint Configuration

**Purpose**: Update linting to recognize Vitest globals instead of Jest

- [x] T008 Update eslint.config.mjs to replace `globals.jest` with Vitest
      globals (`vi`, `describe`, `it`, `expect`, `beforeEach`, `afterEach`,
      `beforeAll`, `afterAll`, `test`)

---

## Phase 3: User Stories 1 & 2 - Unit Test Migration (Priority: P1) 🎯 MVP

**Goal**: All 10 library packages can run unit tests with Vitest via
`nx test <package>`

**Independent Test**: Run `nx test next` and verify tests execute with Vitest

### Package Vitest Configs (10 projects)

- [x] T009 [P] [US1/2] Create packages/azure-node/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/azure-node`)
- [x] T010 [P] [US1/2] Create packages/azure-react/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/azure-react`)
- [x] T011 [P] [US1/2] Create packages/common/core/vitest.config.mts (cacheDir:
      `../../../node_modules/.vite/packages/common/core`)
- [x] T012 [P] [US1/2] Create packages/common/test/vitest.config.mts (cacheDir:
      `../../../node_modules/.vite/packages/common/test`)
- [x] T013 [P] [US1/2] Create packages/create/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/create`)
- [x] T014 [P] [US1/2] Create packages/logger/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/logger`)
- [x] T015 [P] [US1/2] Create packages/next/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/next`)
- [x] T016 [P] [US1/2] Create packages/playwright/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/playwright`)
- [x] T017 [P] [US1/2] Create packages/rest-client/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/rest-client`)
- [x] T018 [P] [US1/2] Create packages/workspace/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/packages/workspace`)

### Remove Jest Configs from Packages

- [x] T019 [P] [US1/2] Delete packages/azure-node/jest.config.ts
- [x] T020 [P] [US1/2] Delete packages/azure-react/jest.config.ts
- [x] T021 [P] [US1/2] Delete packages/common/core/jest.config.ts
- [x] T022 [P] [US1/2] Delete packages/common/test/jest.config.ts
- [x] T023 [P] [US1/2] Delete packages/create/jest.config.ts
- [x] T024 [P] [US1/2] Delete packages/logger/jest.config.ts
- [x] T025 [P] [US1/2] Delete packages/next/jest.config.ts
- [x] T026 [P] [US1/2] Delete packages/playwright/jest.config.ts
- [x] T027 [P] [US1/2] Delete packages/rest-client/jest.config.ts
- [x] T028 [P] [US1/2] Delete packages/workspace/jest.config.ts

### Update Test Files (jest._ → vi._)

- [x] T029 [P] [US1/2] Update
      packages/playwright/src/generators/visual-regression/generator.spec.ts
      (replace `jest.mock`, `jest.fn` with `vi.mock`, `vi.fn`)
- [x] T030 [P] [US1/2] Update
      packages/create/bin/create-stacks-workspace.spec.ts (replace `jest.spyOn`
      with `vi.spyOn`)
- [x] T031 [P] [US1/2] Update packages/create/bin/dependencies.spec.ts (replace
      `jest.Mock` with `Mock` from vitest)
- [x] T032 [P] [US1/2] Update
      packages/azure-node/src/generators/app-insights/generator.spec.ts (replace
      `jest.spyOn` with `vi.spyOn`)
- [x] T033 [P] [US1/2] Update
      packages/common/core/src/utils/executedDependantGenerator.spec.ts (replace
      `jest.spyOn` with `vi.spyOn`)
- [x] T034 [P] [US1/2] Update
      packages/common/core/src/utils/thirdPartyDependencyWarning.spec.ts
      (replace `jest.spyOn` with `vi.spyOn`)
- [x] T035 [P] [US1/2] Update
      packages/common/core/src/utils/deploymentGeneratorMessage.spec.ts (replace
      `jest.spyOn` with `vi.spyOn`)
- [x] T036 [P] [US1/2] Update
      packages/common/core/src/utils/hasGeneratorExecuted.spec.ts (replace
      `jest.spyOn` with `vi.spyOn`)
- [x] T036.1 [P] [US1/2] Update
      packages/next/src/generators/storybook/generator.spec.ts (replace
      `jest.mock`, `jest.fn` with `vi.mock`, `vi.fn`)

### Remove Explicit Test Targets from project.json (inferred targets will be used)

- [x] T037 [P] [US1/2] Remove explicit `test` target from
      packages/azure-node/project.json (if present)
- [x] T038 [P] [US1/2] Remove explicit `test` target from
      packages/azure-react/project.json (if present)
- [x] T039 [P] [US1/2] Remove explicit `test` target from
      packages/common/core/project.json (if present)
- [x] T040 [P] [US1/2] Remove explicit `test` target from
      packages/common/test/project.json (if present)
- [x] T041 [P] [US1/2] Remove explicit `test` target from
      packages/create/project.json (if present)
- [x] T042 [P] [US1/2] Remove explicit `test` target from
      packages/logger/project.json (if present)
- [x] T043 [P] [US1/2] Remove explicit `test` target from
      packages/next/project.json (if present)
- [x] T044 [P] [US1/2] Remove explicit `test` target from
      packages/playwright/project.json (if present)
- [x] T045 [P] [US1/2] Remove explicit `test` target from
      packages/rest-client/project.json (if present)
- [x] T046 [P] [US1/2] Remove explicit `test` target from
      packages/workspace/project.json (if present)

**Checkpoint**: Run `nx run-many -t test --projects=packages/*` - all unit tests
should pass

---

## Phase 4: User Story 3 - E2E Test Migration (Priority: P2)

**Goal**: All 8 E2E projects can run tests with Vitest via
`nx e2e-local <project>`

**Independent Test**: Run `nx e2e-local next-e2e` and verify E2E tests execute

### E2E Vitest Configs (8 projects)

- [x] T047 [P] [US3] Create e2e/azure-node-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/azure-node-e2e`, testTimeout: 180_000)
- [x] T048 [P] [US3] Create e2e/azure-react-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/azure-react-e2e`, testTimeout: 180_000)
- [x] T049 [P] [US3] Create e2e/create-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/create-e2e`, testTimeout: 180_000)
- [x] T050 [P] [US3] Create e2e/logger-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/logger-e2e`, testTimeout: 180_000)
- [x] T051 [P] [US3] Create e2e/next-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/next-e2e`, testTimeout: 180_000)
- [x] T052 [P] [US3] Create e2e/playwright-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/playwright-e2e`, testTimeout: 180_000)
- [x] T053 [P] [US3] Create e2e/rest-client-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/rest-client-e2e`, testTimeout: 180_000)
- [x] T054 [P] [US3] Create e2e/workspace-e2e/vitest.config.mts (cacheDir:
      `../../node_modules/.vite/e2e/workspace-e2e`, testTimeout: 180_000)

### Remove Jest Configs from E2E

- [x] T055 [P] [US3] Delete e2e/azure-node-e2e/jest.config.ts
- [x] T056 [P] [US3] Delete e2e/azure-react-e2e/jest.config.ts
- [x] T057 [P] [US3] Delete e2e/create-e2e/jest.config.ts
- [x] T058 [P] [US3] Delete e2e/logger-e2e/jest.config.ts
- [x] T059 [P] [US3] Delete e2e/next-e2e/jest.config.ts
- [x] T060 [P] [US3] Delete e2e/playwright-e2e/jest.config.ts
- [x] T061 [P] [US3] Delete e2e/rest-client-e2e/jest.config.ts
- [x] T062 [P] [US3] Delete e2e/workspace-e2e/jest.config.ts

### Update E2E project.json Files

- [x] T063 [P] [US3] Update e2e/azure-node-e2e/project.json to use inferred
      `e2e-local` target (remove Jest executor reference)
- [x] T064 [P] [US3] Update e2e/azure-react-e2e/project.json to use inferred
      `e2e-local` target
- [x] T065 [P] [US3] Update e2e/create-e2e/project.json to use inferred
      `e2e-local` target
- [x] T066 [P] [US3] Update e2e/logger-e2e/project.json to use inferred
      `e2e-local` target
- [x] T067 [P] [US3] Update e2e/next-e2e/project.json to use inferred
      `e2e-local` target
- [x] T068 [P] [US3] Update e2e/playwright-e2e/project.json to use inferred
      `e2e-local` target
- [x] T069 [P] [US3] Update e2e/rest-client-e2e/project.json to use inferred
      `e2e-local` target
- [x] T070 [P] [US3] Update e2e/workspace-e2e/project.json to use inferred
      `e2e-local` target

**Checkpoint**: Run `nx e2e-local next-e2e` - E2E tests should pass

---

## Phase 5: Cleanup & Validation

**Purpose**: Remove root Jest artifacts and verify complete migration

- [x] T071 Delete jest.config.ts at workspace root
- [x] T072 Delete jest.preset.js at workspace root
- [x] T073 Run `pnpm exec nx run-many -t lint --fix` to apply formatting
- [x] T074 Run `pnpm exec nx run-many -t test --all` to verify all unit tests
      pass
- [x] T075 Run `pnpm exec nx show project next --web` to verify inferred `test`
      target exists
- [x] T076 Run `pnpm exec nx show project next-e2e --web` to verify inferred
      `e2e-local` target exists

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (ESLint)**: Can run in parallel with Phase 1
- **Phase 3 (Unit Tests)**: Depends on Phase 1 & 2 completion
- **Phase 4 (E2E Tests)**: Depends on Phase 1 & 2 completion (can run parallel
  with Phase 3)
- **Phase 5 (Cleanup)**: Depends on Phase 3 & 4 completion

### Parallel Opportunities

**Phase 1**: T001-T002 sequential (dependencies), T004-T007 can be parallel
after T003

**Phase 3**:

- All T009-T018 (create vitest configs) can run in parallel
- All T019-T028 (delete jest configs) can run in parallel
- All T029-T036 (update test files) can run in parallel
- All T037-T046 (update project.json) can run in parallel

**Phase 4**:

- All T047-T054 (create E2E vitest configs) can run in parallel
- All T055-T062 (delete E2E jest configs) can run in parallel
- All T063-T070 (update E2E project.json) can run in parallel

---

## Summary

| Metric                           | Count                |
| -------------------------------- | -------------------- |
| **Total Tasks**                  | 76                   |
| **Phase 1 (Setup)**              | 7                    |
| **Phase 2 (ESLint)**             | 1                    |
| **Phase 3 (Unit Tests - US1/2)** | 38                   |
| **Phase 4 (E2E Tests - US3)**    | 24                   |
| **Phase 5 (Cleanup)**            | 6                    |
| **Parallelizable Tasks**         | 68 (marked with [P]) |

### MVP Scope

Complete Phases 1-3 for a working MVP where all unit tests run with Vitest. E2E
migration (Phase 4) can follow as a separate increment.

### User Story 4 (Watch Mode)

Watch mode is automatically available via the `testMode: "watch"` configuration
in nx.json (T005). No additional tasks required. Developers can run
`nx test <package>` for watch mode or `nx test-ci <package>` for single-run
mode.
