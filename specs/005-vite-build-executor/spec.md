# Feature Specification: Vite Build Executor with Centralised Dependency Versions

**Feature Branch**: `005-vite-build-executor`  
**Created**: 9 February 2026  
**Status**: Draft  
**Input**: User description: "Change build executor for all packages to use Vite
so hardcoded dependency versions can be moved to root package.json and replaced
as static strings at build time for a single source of truth and security
awareness"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Build Packages with Vite and Inline Dependency Versions (Priority: P1)

As a plugin maintainer, I want packages to build using Vite so that dependency
version constants defined in a central location are resolved and replaced as
static strings in the compiled output. This means generators ship with concrete
version strings without the source code needing to hardcode them.

**Why this priority**: This is the core value proposition. Without this,
dependency versions remain scattered across 11+ constant files in 8 packages,
creating drift between what the monorepo uses and what generators install for
end users. Moving to a build-time replacement model creates a single source of
truth.

**Independent Test**: Build a single package that references a centralised
version constant. Inspect the build output and confirm the constant has been
replaced with the literal version string from the central source.

**Acceptance Scenarios**:

1. **Given** a package references a centralised dependency version constant,
   **When** the package is built, **Then** the compiled output contains the
   literal version string (not an import or variable reference)
2. **Given** a dependency version is updated in the central location, **When**
   any consuming package is rebuilt, **Then** the new version string appears in
   its build output
3. **Given** a package build completes, **When** the output is inspected,
   **Then** no runtime import of the version constants module exists — versions
   are fully inlined

---

### User Story 2 - Centralise All Dependency Versions in Root Package (Priority: P1)

As a plugin maintainer, I want all dependency versions currently hardcoded
across generator constant files to be declared in the root package so I can
manage them in one place, track them with Dependabot, and be aware of security
advisories.

**Why this priority**: Equal priority to Story 1 as centralisation is the
prerequisite for build-time replacement. Currently 60+ version constants are
spread across 11 files in 8 packages. Centralising them enables automated
security scanning and version governance.

**Independent Test**: Verify that every version string previously hardcoded in a
generator constants file now has a corresponding entry in the central location,
and that no generator source file contains hardcoded version strings.

**Acceptance Scenarios**:

1. **Given** the set of all dependency versions previously defined in generator
   constants files, **When** the central version source is inspected, **Then**
   every version has a corresponding entry
2. **Given** a generator needs a dependency version at runtime, **When** the
   generator source is inspected, **Then** it references a centralised constant
   rather than a hardcoded string
3. **Given** a new dependency is needed by a generator, **When** a maintainer
   adds it, **Then** they add it only to the central version source and it
   becomes available to all packages at build time

---

### User Story 3 - Migrate Build Targets from tsc to Vite (Priority: P2)

As a plugin maintainer, I want all package build targets switched from the
current TypeScript compiler executor to a Vite-based build so that the build
pipeline supports the define/replace functionality needed for version inlining,
and so that build tooling is consistent with the existing Vitest test setup.

**Why this priority**: The build executor migration is the enabling
infrastructure for the version replacement feature. It is lower priority than
the version centralisation design because the build tooling is a means to an
end, not the end goal itself.

**Independent Test**: Build each package with the new executor and confirm that
all existing assets (TypeScript declarations, JSON files, template files) are
present in the output, and that the package can be consumed by downstream
projects.

**Acceptance Scenarios**:

1. **Given** a package previously built with the TypeScript compiler executor,
   **When** it is built with the new Vite-based executor, **Then** the output
   directory contains the same files as before (compiled JS, declaration files,
   non-TS assets)
2. **Given** a package is built, **When** the build output is published to
   Verdaccio and consumed by an E2E test project, **Then** the package works
   identically to the previous build
3. **Given** all packages are built in parallel, **When** the full monorepo
   build runs, **Then** it completes successfully with no errors and respects
   dependency ordering

---

### User Story 4 - Security Visibility for Generator Dependencies (Priority: P3)

As a security reviewer, I want all dependency versions that generators install
on behalf of end users to be visible in a single location that automated
scanning tools (Dependabot, Snyk, etc.) can analyse, so that known
vulnerabilities are surfaced before they reach end users.

**Why this priority**: This is a downstream benefit of centralisation. Once
versions are in a scannable location, existing security tooling provides
coverage automatically.

**Independent Test**: Confirm that automated dependency scanning tools detect
and report on the centralised dependency versions.

**Acceptance Scenarios**:

1. **Given** a centralised dependency has a known vulnerability, **When**
   automated security scanning runs, **Then** the vulnerability is reported
2. **Given** a maintainer reviews the central version source, **When** they
   inspect it, **Then** they can see every dependency version that will be
   installed by generators across all packages

---

### Edge Cases

- What happens when a centralised version constant is referenced but has no
  corresponding entry in the central source? The build MUST fail with a clear
  error message identifying the missing version.
- What happens when a package's build output is inspected and a version constant
  was not replaced? This indicates a configuration error — the build MUST either
  fail or produce a warning.
- What happens when the root dependency version and the version constant name
  conflict or overlap with an actual runtime dependency of the plugin itself?
  These MUST be kept distinct so that plugin runtime dependencies and
  generator-installed dependencies do not interfere.
- What happens when non-TypeScript assets (EJS templates, JSON schemas,
  markdown) reference version strings? Only TypeScript/JavaScript source code is
  subject to build-time replacement — template files that reference versions
  MUST continue to work via runtime constants or template interpolation.
- What happens when a version string contains special characters (e.g.,
  `>=1.0.0 <2.0.0` range syntax)? The replacement mechanism MUST handle all
  valid semver and range strings without corruption.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The build system MUST replace all centralised dependency version
  constants with their literal string values during compilation, so that no
  runtime import or resolution of version constants is needed in published
  packages
- **FR-002**: All dependency versions currently hardcoded in generator constant
  files (across 11 files in 8 packages) MUST be migrated to a central version
  source
- **FR-003**: Each package's build target MUST be changed from the current
  TypeScript compiler executor to a Vite-based build executor
- **FR-004**: The Vite build configuration MUST preserve existing build output
  structure: compiled JavaScript, TypeScript declaration files, and
  non-TypeScript assets (JSON, EJS templates, markdown, glob patterns)
- **FR-005**: The build MUST produce output compatible with the existing
  `generators.json` and `executors.json` entry points so that Nx plugin
  resolution continues to work
- **FR-006**: The build MUST fail with a clear, actionable error if a version
  constant is referenced but not defined in the central source
- **FR-007**: The central version source MUST be in a location visible to
  automated dependency scanning tools (Dependabot, Snyk)
- **FR-008**: The build system MUST support all valid semver strings and range
  expressions without corruption during replacement
- **FR-009**: The build MUST respect Nx dependency graph ordering (packages that
  depend on other workspace packages MUST build after their dependencies)
- **FR-010**: All existing unit tests MUST continue to pass after the migration
  with no changes to test assertions
- **FR-011**: All existing E2E tests MUST continue to pass, confirming that
  published packages function correctly when consumed by end users
- **FR-012**: The central version source MUST clearly distinguish between
  dependencies that generators install for end users and dependencies that the
  plugins themselves consume at development time

### Key Entities

- **Central Version Source**: The single location where all generator-installed
  dependency versions are declared. Each entry maps a version constant name to a
  semver string. This source is consumed at build time by the Vite
  define/replace mechanism.
- **Version Constant**: A named reference in generator source code (e.g.,
  `AXIOS_VERSION`) that resolves at build time to a literal string (e.g.,
  `"1.7.7"`). After compilation, the constant no longer exists as a variable —
  it is replaced inline.
- **Build Target**: The Nx target configuration for each package that specifies
  how source code is compiled and what assets are included in the output.
- **Generator Dependency**: A third-party package that a generator installs into
  an end user's project (distinct from the plugin's own development-time
  dependencies).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of packages in the monorepo build successfully with the new
  build executor, producing identical output structure to the previous build
- **SC-002**: Zero hardcoded version strings remain in any generator source file
  — all versions are sourced from the central version source
- **SC-003**: All existing unit tests pass without modification after the
  migration
- **SC-004**: All existing E2E tests pass, confirming end-to-end compatibility
- **SC-005**: A version update in the central source propagates to all consuming
  packages' build output within a single build cycle
- **SC-006**: Automated security scanning tools detect 100% of the centralised
  generator dependency versions
- **SC-007**: Build time for the full monorepo does not increase by more than
  20% compared to the baseline
- **SC-008**: Adding a new generator dependency requires changes to exactly one
  file (the central version source) plus the consuming generator's source code

## Assumptions

- Vite's define/replace mechanism can handle all current version string
  patterns, including semver ranges with special characters
- The existing Vitest configuration does not conflict with introducing Vite as
  the build tool (Vitest already uses Vite internally for tests)
- `@nx/vite` plugin is already a workspace devDependency and provides the
  necessary build executor
- Non-TypeScript assets (EJS templates, JSON schemas, glob patterns) do not need
  build-time version replacement — they either embed versions via template
  interpolation or do not contain version references
- TypeScript declaration file generation (`d.ts`) can be handled by the Vite
  build pipeline (via a plugin or separate tsc emit step)
- The Nx plugin resolution mechanism (generators.json, executors.json) is not
  affected by changing the build tooling, as it depends only on output file
  paths and package.json configuration
- The root `package.json` devDependencies section is scanned by Dependabot,
  making it a suitable location for centralised versions

## Out of Scope

- Changing how generators consume version constants at the call site (i.e., the
  API surface of `addDependenciesToPackageJson` calls remains unchanged)
- Migrating E2E test build configurations (E2E projects use Vitest only, not the
  package build target)
- Changing the Vitest test runner configuration (already on Vite)
- Automating version bumps or introducing a dependency update bot beyond
  existing Dependabot configuration
- Migrating to ESM module format (output format remains as-is unless required by
  Vite)
