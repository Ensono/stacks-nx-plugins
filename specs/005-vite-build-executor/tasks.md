# Tasks: Vite Build Executor with Centralised Dependency Versions

**Input**: Design documents from `/specs/001-vite-build-executor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/version-transform.md, contracts/vite-build-config.md, quickstart.md

**Tests**: Not explicitly requested in spec — test tasks omitted. Existing
unit/E2E tests validate correctness.

**Organization**: Tasks grouped by user story for independent implementation and
testing. US2 and US3 can execute in parallel after foundational work; US1 is
integration validation; US4 is additive.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Install build tooling dependencies

- [x] T001 Install vite-plugin-dts as devDependency via
      `pnpm add -D vite-plugin-dts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Central version infrastructure that MUST be complete before ANY
user story can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create central version registry with generatorDependencyVersions,
      toVersionKey(), and buildVersionDefineMap() in tools/versions.ts
- [x] T003 [P] Create **versions** global type declaration in
      tools/versions.d.ts
- [x] T004 Update tsconfig.base.json to include tools/versions.d.ts in the
      include or files array

**Checkpoint**: Foundation ready — `tools/versions.ts` exports the define map
builder, TypeScript recognises `__versions__.*` references

---

## Phase 3: User Story 2 — Centralise All Dependency Versions (Priority: P1)

**Goal**: Migrate all 63 hardcoded version constants from 11 files in 8 packages
to reference `__versions__.*` globals backed by the central registry in
`tools/versions.ts`.

**Independent Test**: Grep all generator source files for hardcoded semver
strings — zero matches. Grep for `__versions__.*` — every previously hardcoded
constant now uses the global. Every entry in `tools/versions.ts` has a
corresponding `__versions__.*` usage.

### Implementation for User Story 2

- [x] T005 [P] [US2] Replace 22 version constants with **versions**.\*
      references in packages/workspace/src/generators/init/utils/constants.ts
- [x] T006 [P] [US2] Replace 6 version constants with **versions**.\* references
      in packages/next/src/generators/next-auth/utils/constants.ts
- [x] T007 [P] [US2] Replace 2 version constants with **versions**.\* references
      in packages/next/src/generators/react-query/utils/constants.ts
- [x] T008 [P] [US2] Replace 4 version constants with **versions**.\* references
      in packages/next/src/utils/constants.ts
- [x] T009 [P] [US2] Replace 4 version constants with **versions**.\* references
      in packages/next/src/generators/init/utils/constants.ts
- [x] T010 [P] [US2] Replace 12 version constants with **versions**.\*
      references in packages/next/src/generators/storybook/utils/constants.ts
- [x] T011 [P] [US2] Replace version constants with **versions**.\* references
      in packages/logger/src/generators/winston/utils/version.ts and resolve
      duplicate eslint entries per version conflict rule (root package.json
      wins)
- [x] T012 [P] [US2] Replace 5 version constants with **versions**.\* references
      in packages/rest-client/src/utils/versions.ts
- [x] T013 [P] [US2] Replace 1 version constant with **versions**.\* reference
      in packages/azure-node/src/utils/versions.ts
- [x] T014 [P] [US2] Replace 2 version constants with **versions**.\* references
      in packages/azure-react/src/utils/versions.ts
- [x] T015 [P] [US2] Replace 4 version constants with **versions**.\* references
      in packages/playwright/src/utils/versions.ts
- [x] T016 [US2] Add `define: buildVersionDefineMap()` import and config to all
      package vitest.config.mts files for test-time version resolution

**Checkpoint**: All version constants reference `__versions__.*`. Unit tests
pass via vitest define maps. No hardcoded semver strings in generator source.

---

## Phase 4: User Story 3 — Migrate Build Targets from tsc to Vite (Priority: P2)

**Goal**: Switch all 10 package build targets from `@nx/js:tsc` to `@nx/vite`
inferred tasks by creating `vite.config.ts` per package, updating `nx.json`
plugin registrations, and removing explicit build targets.

**Independent Test**: Run `nx run-many -t build --all`. Each package produces
`dist/` with compiled JS, `.d.ts` declarations, and non-TS assets (JSON, EJS,
markdown). Run `nx show project next` and confirm build executor is
`@nx/vite:build`.

### Implementation for User Story 3

- [x] T017 [US3] Update nx.json: add @nx/vite plugin registration, remove build
      section from @nx/js/typescript, consolidate @nx/vitest registrations,
      remove @nx/js:tsc target defaults
- [x] T018 [P] [US3] Create packages/next/vite.config.ts with lib build, dts,
      nxCopyAssetsPlugin, and define map
- [x] T019 [P] [US3] Create packages/workspace/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map
- [x] T020 [P] [US3] Create packages/logger/vite.config.ts with lib build, dts,
      nxCopyAssetsPlugin, and define map
- [x] T021 [P] [US3] Create packages/rest-client/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map
- [x] T022 [P] [US3] Create packages/playwright/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map
- [x] T023 [P] [US3] Create packages/azure-node/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map
- [x] T024 [P] [US3] Create packages/azure-react/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map
- [x] T025 [P] [US3] Create packages/create/vite.config.ts with lib build, dts,
      nxCopyAssetsPlugin, and define map
- [x] T026 [P] [US3] Create packages/common/core/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map (import path:
      ../../../tools/versions)
- [x] T027 [P] [US3] Create packages/common/test/vite.config.ts with lib build,
      dts, nxCopyAssetsPlugin, and define map (import path:
      ../../../tools/versions)
- [x] T028 [US3] Remove explicit @nx/js:tsc build targets from all 10
      project.json files under packages/

**Checkpoint**: All packages build via Vite inferred tasks.
`nx show project <name>` shows `@nx/vite:build`. Output structure matches
previous tsc build.

---

## Phase 5: User Story 1 — Build with Vite and Inline Dependency Versions (Priority: P1)

**Goal**: Validate end-to-end that Vite build with `define` config replaces all
`__versions__.*` references with literal version strings in compiled output.

**Independent Test**: Build a package (e.g., rest-client). Grep `dist/` for
`__versions__` — zero matches. Grep for literal version strings (e.g.,
`"1.7.7"`) — present in output. No runtime import of tools/versions.ts exists.

### Implementation for User Story 1

- [ ] T029 [US1] Build all packages via
      `nx run-many -t build --all --parallel 8`
- [ ] T030 [US1] Verify no `__versions__` references remain in any
      packages/\*/dist/ output and confirm literal version strings are present
- [ ] T031 [US1] Run all unit tests via `nx run-many -t test --all --parallel 8`
      to confirm no regressions

**Checkpoint**: All version constants are fully inlined as literal strings in
compiled output. All unit tests pass.

---

## Phase 6: User Story 4 — Security Visibility for Generator Dependencies (Priority: P3)

**Goal**: Make all generator-installed dependency versions visible to automated
scanning tools (Dependabot, Snyk) by adding them to root `package.json`
devDependencies.

**Independent Test**: Compare every key in `generatorDependencyVersions` against
root `package.json` devDependencies — every entry is present. Run `dependabot`
or equivalent scanner — all centralised dependencies are detected.

### Implementation for User Story 4

- [ ] T032 [US4] Add all generatorDependencyVersions entries to root
      package.json devDependencies (root version wins on conflicts, add missing
      entries)
- [ ] T033 [US4] Run `pnpm install` to update lockfile with new devDependencies

**Checkpoint**: Every generator dependency version is declared in root
`package.json` and visible to Dependabot.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, E2E testing, and cleanup

- [ ] T034 Run affected E2E tests via `nx affected -t e2e`
- [ ] T035 [P] Verify Nx project graph shows correct inferred build targets via
      `nx show project <name>` for each package
- [ ] T036 [P] Run lint and auto-fix across all packages via
      `nx run-many -t lint --fix`
- [ ] T037 Validate quickstart.md workflow matches final implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US2 (Phase 3)**: Depends on Foundational — can run in parallel with US3
- **US3 (Phase 4)**: Depends on Foundational — can run in parallel with US2
- **US1 (Phase 5)**: Depends on **both US2 AND US3** completing — integration
  validation
- **US4 (Phase 6)**: Depends on Foundational only — can start after Phase 2, but
  logically runs after US1 confirmation
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US2 (P1)**: Can start after Phase 2. Independent of US3. Requires
  tools/versions.ts + .d.ts to exist.
- **US3 (P2)**: Can start after Phase 2. Independent of US2. Requires nx.json
  changes + vite.config.ts creation.
- **US1 (P1)**: Depends on US2 + US3. Cannot start until both are complete.
  Validates end-to-end version inlining.
- **US4 (P3)**: Can start after Phase 2. Adds root package.json entries for
  Dependabot.

### Within Each User Story

- US2: All version file migrations (T005–T015) are parallelizable. T016 (vitest
  configs) depends on all migrations completing.
- US3: T017 (nx.json) must complete first. T018–T027 (vite configs) are all
  parallelizable after T017. T028 (remove build targets) depends on vite configs
  existing.
- US1: Sequential — build first, then verify, then test.
- US4: Sequential — add deps, then install.

### Parallel Opportunities

- T002 and T003 (foundational) run in parallel
- T005–T015 (version file migrations) all run in parallel
- T018–T027 (vite config creation) all run in parallel
- US2 and US3 can run in parallel as separate workstreams
- T034–T036 (polish) partially parallel

---

## Parallel Example: User Story 2

```bash
# All version file migrations in parallel:
T005: packages/workspace/src/generators/init/utils/constants.ts
T006: packages/next/src/generators/next-auth/utils/constants.ts
T007: packages/next/src/generators/react-query/utils/constants.ts
T008: packages/next/src/utils/constants.ts
T009: packages/next/src/generators/init/utils/constants.ts
T010: packages/next/src/generators/storybook/utils/constants.ts
T011: packages/logger/src/generators/winston/utils/version.ts
T012: packages/rest-client/src/utils/versions.ts
T013: packages/azure-node/src/utils/versions.ts
T014: packages/azure-react/src/utils/versions.ts
T015: packages/playwright/src/utils/versions.ts

# Then sequentially after all above complete:
T016: Update all vitest.config.mts files
```

## Parallel Example: User Story 3

```bash
# First (sequential):
T017: Update nx.json

# Then all vite configs in parallel:
T018–T027: Create vite.config.ts for each package

# Then (sequential):
T028: Remove build targets from project.json files
```

---

## Implementation Strategy

### MVP First (US2 + US3 → US1 Validation)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US2 — centralise version constants
4. Complete Phase 4: US3 — migrate to Vite build
5. Complete Phase 5: US1 — **STOP and VALIDATE**: build + verify version
   inlining
6. Deploy/demo if ready — this is the core MVP

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US2 → all versions centralised → independently verifiable
3. US3 → all builds use Vite → independently verifiable
4. US1 → integration validated → **MVP complete**
5. US4 → Dependabot visibility → security benefit added
6. Polish → E2E, lint, docs validation

### Parallel Team Strategy

With two developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
    - Developer A: US2 (version migration)
    - Developer B: US3 (Vite build migration)
3. Both converge: US1 (integration validation)
4. Either: US4 + Polish

---

## Notes

- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Non-version constants (`PACKAGE_JSON`, `REACT_QUERY_NPM_PACKAGE_NAME`,
  `NODE_LTS`, `NX_VERSION_SCOPE`) remain as hardcoded strings — see plan.md
  Phase D1
- `packages/common/e2e` does NOT get a vite.config.ts — it has no build target
- `packages/common/core` and `packages/common/test` use
  `../../../tools/versions` import path (deeper nesting)
- Version conflict rule: root `package.json` version is authoritative — update
  `tools/versions.ts` to match
- Commit after each task or logical group
