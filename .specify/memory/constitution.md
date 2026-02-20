<!--
  Sync Impact Report
  ==================
  Version change: 1.1.0 → 1.2.0

  Modified principles: None

  Added sections:
  - Principle IX: Generator Parity (NEW)

  Removed sections: None

  Templates requiring updates:
  - plan-template.md: ✅ No changes needed (Technical Context covers this implicitly)
  - spec-template.md: ✅ No changes needed (requirements focused)
  - tasks-template.md: ✅ No changes needed (task focused)
  - agent-file-template.md: ✅ No changes needed (auto-generated)
  - checklist-template.md: ✅ No changes needed (generic structure)

  Follow-up TODOs: None
-->

# Ensono Stacks Nx Plugins Constitution

## Mission

A collection of open source Nx monorepo plugins to create enterprise-ready
software solutions. We leverage Nx and use the ecosystem wherever possible.

## Core Principles

### I. Nx-Native Design

All plugins must feel native to the Nx ecosystem. Generators and executors
follow Nx conventions, use `@nx/devkit` APIs, and integrate seamlessly with Nx
Console, `nx graph`, and affected commands. Avoid reinventing what Nx already
provides.

### II. Co-locate by Technology

Plugins are grouped by technology, as they become individually installed
dependencies. Not all plugins are mandatory in a workspace.

- The name should reflect the technology
- Plugins can use other plugins, but must be specified as a `dependency`.

### III. Opt-In Flexibility

Every feature must be optional. Users choose what to adopt:

- Split generators by responsibility: `init` (core setup), feature-specific
  (enhancements)
- Use schema options with sensible defaults and `x-prompt` for interactive
  discovery
- Never force dependencies or configurations users don't need

### IV. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory:

1. Create end-state branches showing desired outcome
2. Write unit tests from git diffs before implementation
3. Red → Green → Refactor cycle strictly enforced
4. Minimum 80% coverage for branches/functions/lines/statements

### V. End-to-End Testing (NON-NEGOTIABLE)

Every feature must be covered with an E2E test. Not every permutation of a
feature needs to be tested. Test the full kitchen sink, or when different
options overlap functionality. E2E tests are expensive as it leverages Verdaccio
and installs into an `nx-e2e` folder. So only one test can be performed at a
time.

### VI. Enterprise-Ready Quality

Plugins must be production-grade:

- Consistent validation via `verifyPluginCanBeInstalled()` and
  `hasGeneratorExecutedForProject()`
- Proper error handling with actionable messages
- Documentation for all public APIs and generators
- Security considerations reviewed for all changes

### VII. Single Source of Truth

Leverage existing Nx infrastructure:

- Stacks configuration stored in `nx.json` under `stacks` key
- Use `nx.json` `executedGenerators` to track generator runs
- Share utilities via `@ensono-stacks/core`, not duplicated code
- Respect workspace-level and project-level configurations

### VIII. Automated Formatting Only (NON-NEGOTIABLE)

Agents and contributors MUST NOT manually apply code formatting. Formatting is
handled exclusively by ESLint and Prettier through Nx:

- **Single project**: `pnpm exec nx run <project>:lint --fix`
- **All projects**: `pnpm exec nx run-many -t lint --fix`
- Agents MUST run the appropriate lint command after modifying documents
- Never manually adjust whitespace, indentation, or code style
- Trust the configured toolchain (ESLint + Prettier) to enforce consistency

### IX. Generator Parity (NON-NEGOTIABLE)

This monorepo's plugins generate code in consumer Nx workspaces. Changes made to
the generated workspace output MUST be propagated back to the source generators:

- When updating dependencies (e.g., Next.js, Playwright, Nx), apply migrations
  to both test workspaces AND generator templates/code
- New patterns, configurations, or best practices adopted in generated projects
  MUST be reflected in the corresponding generator under
  `packages/<plugin>/src/generators/`
- Generator templates, default configurations, and scaffolded code MUST produce
  output that matches current best practices
- Breaking changes in upstream technologies require corresponding updates to
  generators, their schemas, and associated E2E tests

## Technical Standards

### Package Management

- **pnpm only** – `npm` and `npx` are FORBIDDEN; use `pnpm` and `pnpm exec`
  exclusively
- Frozen lockfiles required (`pnpm install --frozen-lockfile`)
- All packages published to npm under `@ensono-stacks/` scope
- Single semantic version across all packages (Nx-style versioning)

### Plugin Architecture

- Generators in `src/generators/`, executors in `src/executors/`
- Registry files: `generators.json`, `executors.json`
- Shared utilities via path aliases (`@ensono-stacks/*`)
- Template files using EJS interpolation via `addFiles()`

### Commit Standards

- Conventional commits enforced via Husky + Commitizen
- Types: `feat`, `fix`, `deps`, `docs`, `test`, `chore`, `ci`
- Scopes: package names (validated by commitlint)
- Branch naming: `feat/`, `fix/`, `docs/` prefixes

## Quality Gates

All changes must pass before merge:

1. Unit tests pass for affected packages
2. E2E tests pass for affected plugins
3. Linting passes with no errors
4. Code review approval obtained
5. Coverage thresholds met

## Governance

This constitution supersedes all other practices. Amendments require:

1. Documentation of proposed change and rationale
2. Team review and approval
3. Migration plan for breaking changes

All PRs must verify compliance with these principles. Use `CONTRIBUTING.md` for
detailed development guidance.

**Version**: 1.2.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-03
