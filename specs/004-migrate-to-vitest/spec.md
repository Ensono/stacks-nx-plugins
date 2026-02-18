# Feature Specification: Migrate from Jest to Vitest

**Feature Branch**: `004-migrate-to-vitest`  
**Created**: 5 February 2026  
**Status**: Draft  
**Input**: User description: "Replace Jest with Vitest across all projects.
Vitest is now our preferred testing framework as it supports ESM which is only
experimental with Jest. It has a similar API so minimal test changes are
required."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Run Unit Tests with Vitest (Priority: P1)

As a developer working on the Stacks Nx Plugins, I want to run unit tests using
Vitest so that I can leverage native ESM support without experimental flags and
benefit from faster test execution.

**Why this priority**: This is the core functionality - developers must be able
to run tests reliably. Without working tests, no development work can be
validated.

**Independent Test**: Can be fully tested by running `nx test <project>` on any
package and verifying tests execute and pass with Vitest.

**Acceptance Scenarios**:

1. **Given** a developer has made changes to a package, **When** they run
   `nx test <package-name>`, **Then** Vitest executes the tests and reports
   results.
2. **Given** a developer runs tests, **When** tests complete, **Then** coverage
   reports are generated in the same format as before (text and HTML).
3. **Given** the existing test files use Jest APIs (describe, it, expect,
   beforeEach, etc.), **When** tests run under Vitest, **Then** tests pass
   without modification to the test assertion syntax.

---

### User Story 2 - Run All Tests Across Workspace (Priority: P1)

As a developer, I want to run all tests across the monorepo using Nx commands so
that I can validate the entire codebase before committing.

**Why this priority**: CI/CD pipelines and developers rely on running tests
across the entire workspace. This is equally critical as individual test
execution.

**Independent Test**: Can be fully tested by running `nx run-many -t test --all`
and verifying all 19 projects with tests execute successfully.

**Acceptance Scenarios**:

1. **Given** a developer wants to test all packages, **When** they run
   `nx run-many -t test --all`, **Then** Vitest runs tests for all configured
   projects.
2. **Given** a developer wants to test affected packages, **When** they run
   `nx affected -t test`, **Then** only affected projects' tests are executed
   with Vitest.
3. **Given** tests are run in CI, **When** the CI pipeline executes, **Then**
   test results and coverage meet the existing 80% threshold requirements.

---

### User Story 3 - E2E Test Execution (Priority: P2)

As a developer, I want E2E tests to run with Vitest so that integration tests
also benefit from native ESM support and consistent tooling.

**Why this priority**: E2E tests are critical for validating plugin
functionality but run less frequently than unit tests. They can be migrated
after unit tests are confirmed working.

**Independent Test**: Can be fully tested by running `nx e2e <plugin>-e2e` and
verifying tests execute against Verdaccio-published packages.

**Acceptance Scenarios**:

1. **Given** E2E tests exist for a plugin, **When** a developer runs
   `nx e2e <plugin>-e2e`, **Then** Vitest executes the E2E tests successfully.
2. **Given** E2E tests require longer timeouts, **When** tests run, **Then** the
   180-second timeout configuration is preserved.

---

### User Story 4 - Maintain Test Watch Mode (Priority: P3)

As a developer, I want to run tests in watch mode so that I can get immediate
feedback during development.

**Why this priority**: Watch mode improves developer experience but is not
essential for CI or release processes.

**Independent Test**: Can be fully tested by running `nx test <package> --watch`
and modifying a test file to verify automatic re-execution.

**Acceptance Scenarios**:

1. **Given** a developer is actively developing, **When** they run
   `nx test <package> --watch`, **Then** Vitest watches for file changes and
   re-runs affected tests.

---

### Edge Cases

- What happens when a test uses Jest-specific APIs not available in Vitest
  (e.g., `jest.mock` with certain module patterns)? Tests requiring
  Jest-specific mocking patterns should be identified and refactored to use
  `vi.mock()`.
- How does the system handle test files that import from ESM-only packages?
  Vitest handles these natively without the `--experimental-vm-modules` flag
  currently required by Jest.
- What happens if a developer has Jest extensions installed in their IDE? IDE
  integrations should be updated to recognize Vitest configuration files.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST replace all Jest dependencies with equivalent Vitest
  packages in the root `package.json`
- **FR-002**: System MUST replace `jest.config.ts` files in all 19 projects with
  `vitest.config.ts` equivalents
- **FR-003**: System MUST remove the root `jest.preset.js` and create a shared
  Vitest configuration
- **FR-004**: System MUST preserve existing coverage thresholds (80% branches,
  functions, lines, statements)
- **FR-005**: System MUST preserve existing test timeout configurations (180
  seconds for E2E tests)
- **FR-006**: System MUST update Nx workspace configuration to use Vitest
  executor instead of Jest executor
- **FR-007**: System MUST maintain compatibility with existing test file
  locations and naming conventions (`*.spec.ts`, `*.test.ts`)
- **FR-008**: System MUST update ESLint configuration to replace
  `eslint-plugin-jest` with `eslint-plugin-vitest`
- **FR-009**: System MUST ensure coverage reports continue to be generated in
  text and HTML formats in the existing coverage directories
- **FR-010**: Test files MUST NOT require changes to basic test syntax
  (describe, it, expect, beforeEach, afterEach, beforeAll, afterAll)
- **FR-011**: System MUST remove the `--experimental-vm-modules` NODE_OPTIONS
  flag as it will no longer be required
- **FR-012**: System MUST update any Jest-specific mock calls (`jest.mock()`,
  `jest.fn()`, `jest.spyOn()`) to Vitest equivalents (`vi.mock()`, `vi.fn()`,
  `vi.spyOn()`)

### Key Entities

- **Vitest Configuration**: Central configuration that replaces
  `jest.preset.js`, containing shared settings for all projects
- **Project Test Configurations**: Per-project `vitest.config.ts` files that
  extend the shared configuration
- **Coverage Reports**: HTML and text reports generated in project-specific
  `coverage/` directories

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 19 existing Jest configurations are replaced with Vitest
  configurations
- **SC-002**: 100% of existing unit tests pass under Vitest without changes to
  test assertion syntax
- **SC-003**: 100% of existing E2E tests pass under Vitest
- **SC-004**: Test coverage continues to meet or exceed the 80% threshold across
  branches, functions, lines, and statements
- **SC-005**: Test execution time is equal to or faster than the current
  Jest-based execution
- **SC-006**: CI pipeline completes successfully with all tests passing
- **SC-007**: No `--experimental-vm-modules` flags are required in any
  configuration
- **SC-008**: Developers can run watch mode for immediate feedback during
  development

## Assumptions

- Vitest's Jest-compatible API will handle the existing test syntax without
  modification
- Vitest executor or plugin is available for Nx integration
- ESM support in Vitest eliminates the need for experimental Node.js flags
- Existing mocking patterns using `jest.mock()` can be replaced with `vi.mock()`
  with minimal effort
- Coverage reporting tools used by Vitest produce compatible output formats

## Out of Scope

- Migrating tests to use Vitest-specific features beyond basic compatibility
- Changing test file structure or organization
- Adding new tests as part of this migration
- Modifying the actual test logic or assertions beyond what's required for
  compatibility
