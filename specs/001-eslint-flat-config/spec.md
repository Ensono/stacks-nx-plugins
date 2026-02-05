# Feature Specification: ESLint v9 Flat Config Migration

**Feature Branch**: `001-eslint-flat-config`  
**Created**: 3 February 2026  
**Status**: Draft  
**Input**: User description: "Migrate ESLint to version ^9.8.0 and adopt flat
configs across the monorepo and plugins. All supporting ESLint plugins should be
updated to reach feature parity as best as possible. These changes need to be
migrated to plugins as well, where we can apply flat config changes across
consumer workspaces."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Workspace Linting with Flat Config (Priority: P1)

As a developer working on the stacks-nx-plugins monorepo, I want the workspace
to use ESLint v9 with flat config so that I benefit from improved performance,
simplified configuration, and modern linting capabilities.

**Why this priority**: This is the foundation - without the monorepo itself
migrated, plugins cannot generate flat config for consumers. The development
team uses this workspace daily.

**Independent Test**: Run `nx lint` on any project in the workspace and verify
linting completes successfully with the same rule coverage as before.

**Acceptance Scenarios**:

1. **Given** the monorepo has ESLint v9 installed, **When** a developer runs
   `nx lint <project>`, **Then** linting executes successfully using
   `eslint.config.js` (flat config format)
2. **Given** the flat config is in place, **When** existing code is linted,
   **Then** the same violations are detected as with the previous ESLint v8
   configuration
3. **Given** a project has TypeScript files, **When** linting runs, **Then**
   TypeScript-specific rules from `@typescript-eslint` are applied correctly
4. **Given** the Nx workspace has module boundaries defined, **When** linting
   runs, **Then** `@nx/enforce-module-boundaries` rules are enforced as before

---

### User Story 2 - Plugin Generators Produce Flat Config (Priority: P2)

As a consumer of Ensono Stacks plugins, I want the generators to produce ESLint
flat config files so that new projects I scaffold are using the modern ESLint
configuration format.

**Why this priority**: This enables all new consumer workspaces to benefit from
flat config. Depends on P1 being complete to understand the correct patterns.

**Independent Test**: Run the workspace init generator in a new Nx workspace and
verify an `eslint.config.js` file is created instead of `.eslintrc.json`.

**Acceptance Scenarios**:

1. **Given** a new Nx workspace, **When** a user runs
   `@ensono-stacks/workspace:init` with the `--eslint` flag, **Then** an
   `eslint.config.js` file is created at the root with Stacks defaults
2. **Given** a workspace with the Next.js plugin, **When** a user runs
   `@ensono-stacks/next:init`, **Then** project-level ESLint configuration is
   added in flat config format
3. **Given** any Stacks generator that configures ESLint, **When** the generator
   runs, **Then** it produces flat config compatible output

---

### User Story 3 - Core Utilities Support Flat Config (Priority: P2)

As a plugin developer, I want `@ensono-stacks/core` to provide utilities for
reading and writing flat config so that all plugins can consistently work with
the new format.

**Why this priority**: Core utilities are shared across all plugins. Must be
done alongside or before P2 to avoid duplication.

**Independent Test**: Import flat config utilities from `@ensono-stacks/core` in
a plugin and successfully read/write an `eslint.config.js` file.

**Acceptance Scenarios**:

1. **Given** a tree with an `eslint.config.js` file, **When** using core
   utilities to read the config, **Then** the configuration object is correctly
   parsed and returned
2. **Given** a tree without ESLint config, **When** using core utilities to
   write a new flat config, **Then** a valid `eslint.config.js` file is created
3. **Given** an existing flat config, **When** using core utilities to merge
   configurations, **Then** the configs are combined correctly following ESLint
   v9 flat config semantics

---

### User Story 4 - ESLint Plugin Compatibility (Priority: P3)

As a developer, I want all ESLint plugins used in the workspace to be updated to
versions compatible with ESLint v9 and flat config so that linting functionality
is not degraded.

**Why this priority**: Plugin compatibility is a supporting concern. Most modern
plugins already support flat config, but verification and updates are needed.

**Independent Test**: Run the full test suite with all linting-related tests
passing after plugin updates.

**Acceptance Scenarios**:

1. **Given** ESLint v9 is installed, **When** all configured plugins are loaded,
   **Then** no compatibility errors occur
2. **Given** security rules from `eslint-plugin-security`, **When** linting
   runs, **Then** security rules are enforced as before
3. **Given** unicorn rules are configured, **When** linting runs, **Then** code
   style rules are enforced as before
4. **Given** import ordering rules, **When** linting runs, **Then** import order
   is validated correctly

---

### Edge Cases

- What happens when a consumer workspace already has a legacy `.eslintrc.json`
  file and runs a Stacks generator?
- How does the system handle workspaces that have partially migrated to flat
  config?
- What happens when a required plugin does not yet support ESLint v9 flat
  config?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Workspace MUST use ESLint version ^9.8.0 with flat config format
  (`eslint.config.js`)
- **FR-002**: Workspace MUST replace all `.eslintrc.json` files (root and
  project-level) with flat config equivalents
- **FR-003**: `@ensono-stacks/core` MUST provide utilities for reading, writing,
  and merging ESLint flat configs
- **FR-004**: `@ensono-stacks/workspace:init` generator MUST generate
  `eslint.config.js` instead of `.eslintrc.json` when `--eslint` flag is used
- **FR-005**: `@ensono-stacks/next:init` generator MUST produce flat config
  compatible ESLint configuration for Next.js projects
- **FR-006**: All ESLint plugins MUST be updated to versions compatible with
  ESLint v9 flat config
- **FR-007**: `@nx/enforce-module-boundaries` rule MUST continue to function
  with flat config
- **FR-008**: TypeScript linting via `@typescript-eslint` MUST work correctly
  with flat config
- **FR-009**: Import ordering rules via `eslint-plugin-import` MUST work
  correctly with flat config
- **FR-010**: Security linting via `eslint-plugin-security` MUST work correctly
  with flat config
- **FR-011**: Code style rules via `eslint-plugin-unicorn` MUST work correctly
  with flat config
- **FR-012**: Prettier integration via `eslint-plugin-prettier` MUST work
  correctly with flat config
- **FR-013**: Testing rules via `eslint-plugin-jest` and
  `eslint-plugin-testing-library` MUST work correctly with flat config
- **FR-014**: Existing unit tests referencing `.eslintrc.json` MUST be updated
  to test flat config generation
- **FR-015**: E2E tests MUST verify generators produce working flat config in
  consumer workspaces

### Key Entities

- **Root ESLint Config**: The workspace-level `eslint.config.js` that defines
  shared rules and plugin configurations
- **Project ESLint Config**: Project-specific flat config that extends or
  overrides root configuration
- **Core ESLint Utilities**: Functions in `@ensono-stacks/core` for manipulating
  ESLint flat config files
- **Plugin Version Matrix**: Mapping of ESLint plugins to their ESLint v9
  compatible versions

## Assumptions

- ESLint v9.8.0+ is stable and production-ready for monorepo use
- All critical ESLint plugins used in the workspace have flat config compatible
  versions available
- Nx 22.x fully supports ESLint v9 with flat config (verified: `@nx/eslint`
  supports flat config)
- Consumer workspaces will be new or willing to migrate from legacy config
  format
- The `formatFilesWithEslint` utility in `@ensono-stacks/core` will need updates
  to work with flat config

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All 12 `.eslintrc.json` files in the workspace are replaced with
  flat config, with zero linting configuration regressions
- **SC-002**: `nx lint` passes on all projects with the same or improved rule
  coverage compared to pre-migration
- **SC-003**: All existing unit tests pass after updating ESLint-related test
  assertions
- **SC-004**: All E2E tests pass, confirming generators produce valid flat
  config in new workspaces
- **SC-005**: Consumer workspaces generated with Stacks plugins successfully
  lint using the new flat config format
- **SC-006**: Migration can be completed without breaking changes to the public
  generator APIs
