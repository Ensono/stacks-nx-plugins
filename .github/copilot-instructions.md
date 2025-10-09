# Ensono Stacks Nx Plugins - AI Agent Guide

## Architecture Overview

This is a **monorepo of Nx plugins** that extend the Nx framework for enterprise applications. The workspace contains:

- **Plugins** (`packages/`): Nx generators and executors for Next.js, Azure integrations, REST clients, Playwright, and more
- **E2E Tests** (`e2e/`): Integration tests that publish to Verdaccio and test real-world usage
- **Common Libraries** (`packages/common/{core,e2e,test}`): Shared utilities for plugin development

### Key Architectural Patterns

**Plugin Structure**: Each plugin follows a standard layout:
```
packages/<plugin-name>/
├── src/generators/         # Code generators (init, feature-specific)
├── src/executors/          # Custom Nx targets (if needed)
├── generators.json         # Generator registry
├── executors.json          # Executor registry (if present)
└── utils/                  # Plugin-specific utilities
```

**Generator Responsibility Split**: Generators follow a layered approach:
- `init`: Core requirements and base configuration
- `init-deployment`: Deployment infrastructure (Azure DevOps, Terraform)
- Feature-specific generators: Optional enhancements (e.g., `next-auth`, `storybook`)

**Stacks Configuration**: All plugins require a `stacks` object in `nx.json` with business/cloud/domain metadata. Check with `verifyPluginCanBeInstalled()` and track execution via `hasGeneratorExecutedForProject()`.

## Critical Development Workflows

### Setup
```bash
pnpm install --frozen-lockfile
pnpm run prepare  # Sets up Husky for commit conventions
```

### Testing Strategy

**Unit Tests** (TDD approach required):
- Write tests first by creating the desired end state in a branch
- Use git diff to identify all file changes
- Test file creation/modification using `@ensono-stacks/test` utilities
- Snapshot test generated files with `tsMorphTree()` for TypeScript files
```bash
nx test <package-name>              # Single package
nx affected -t test                 # Changed packages only
nx run-many -t test --all --parallel 8
```

**E2E Tests** (always required for new generators):
- Tests run via custom `@ensono-stacks/e2e` executor with Verdaccio
- Update `implicitDependencies` in `e2e/<plugin>-e2e/project.json` to include your plugin
- Use `newProject()` to scaffold workspaces, then test generator execution
```bash
nx e2e <plugin-name>-e2e
```

**Local Testing with Verdaccio**:
```bash
pnpm run local-registry  # Starts registry at http://localhost:4873
# In separate terminal:
pnpx @ensono-stacks/create-stacks-workspace@e2e --stacksVersion=e2e
```

### Building and Publishing

**Build**:
```bash
nx build <package-name>
nx run-many -t build --all --parallel 8
```

**Release Process**:
- All packages share a single semantic version (similar to Nx)
- **Prerelease** (automatic on merge to `main`): Creates `@dev` tag via `.github/workflows/prerelease.yml`
- **Release** (manual): Run `.github/workflows/release.yml` to create `@latest` tag
- Conventional commits determine version bumps (uses `@commitlint/config-conventional`)

### Commit Standards

**Required format**: Use Commitizen (triggered by Husky pre-commit hook)
```
<type>(scope): <description>

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `deps`, `docs`, `test`, `chore`, `ci`  
**Scopes**: Package names (without `-e2e` suffix), validated by commitlint

**Branch naming**:
- `feat/name` for features
- `fix/name` for bug fixes  
- `docs/name` for documentation

## Creating a New Plugin

### Step 1: Create End State Branches
1. Create baseline workspace with target framework (e.g., Next.js)
2. Branch 1 (`<plugin>-baseline`): Add all configurations for `init` generator
3. Branch 2 (`<plugin>-<feature>`): Add feature-specific changes for additional generators
4. Use git diffs to identify exact file changes needed

### Step 2: Scaffold Plugin
```bash
nx g @nx/plugin:plugin <name> --importPath @ensono-stacks/<name>
nx generate @nx/plugin:generator <generator-name> --project=<plugin-name>
```

### Step 3: TDD Implementation
**Required validations** (first lines in generator):
```typescript
verifyPluginCanBeInstalled(tree, options.project);  // Checks Nx monorepo compatibility

// For single-run generators only:
if (hasGeneratorExecutedForProject(tree, options.project, 'GeneratorName', true)) {
    return;
}
```

**Common utilities** from `@ensono-stacks/core`:
- `tsMorphTree()`: TypeScript AST manipulation
- `addFiles()`: Copy templates with EJS interpolation
- `formatFilesWithEslint()`: Apply project formatting
- `readStacksConfig()`: Access Stacks configuration from nx.json

### Step 4: E2E Tests
Add plugin to `implicitDependencies` in `e2e/<plugin>-e2e/project.json`, then write tests:
```typescript
await newProject(['@ensono-stacks/<plugin>'], ['@nx/required-deps']);
await runNxCommandAsync('generate @ensono-stacks/<plugin>:init --no-interactive');
// Verify files exist and target execution works
```

## Project-Specific Conventions

### Path Aliases
Always use TypeScript path aliases from `tsconfig.base.json`:
```typescript
import { verifyPluginCanBeInstalled } from '@ensono-stacks/core';
import { newProject, cleanup } from '@ensono-stacks/e2e';
```

### Test Coverage
- Required: 80% branches/functions/lines/statements (enforced in `jest.preset.js`)
- Timeout: 180s for E2E tests (defined in preset)

### Nx Target Conventions
- `build`: Compiles with `@nx/js:tsc`, includes JSON/Markdown assets
- `test`: Jest with `ci` configuration for coverage reports
- `e2e` / `e2e-ci`: Separate targets for local vs CI (Verdaccio setup)
- `lint`: ESLint with `release` configuration for auto-fixing

### Generator Schemas
Use `x-prompt` in `schema.json` for interactive prompts:
```json
{
  "project": {
    "type": "string",
    "description": "Project name",
    "x-prompt": "What is the name of the project?"
  }
}
```

## Integration Points

### Nx DevKit
Primary API for file manipulation. Key imports:
```typescript
import { Tree, readProjectConfiguration, updateProjectConfiguration, formatFiles } from '@nx/devkit';
```

### Verdaccio (E2E Registry)
- Custom executor at `packages/common/e2e/src/executors/e2e/executor.ts`
- Automatically builds and publishes dependent packages
- Registry URL: `http://localhost:4873` (check `process.env.npm_config_registry`)

### Workspace Configuration
Stacks metadata stored in `nx.json` under `stacks` key:
```json
{
  "stacks": {
    "config": { "business": {}, "cloud": {}, "domain": {}, "vcs": {} },
    "executedGenerators": {}
  }
}
```

## Common Pitfalls

1. **Forgetting `implicitDependencies`**: E2E tests will use published versions instead of local builds
2. **Missing validation calls**: Always call `verifyPluginCanBeInstalled()` and `hasGeneratorExecutedForProject()` (if applicable)
3. **Snapshot tests without context**: Include 3+ lines of surrounding code in git diffs when writing unit tests
4. **Wrong package manager commands**: This repo uses `pnpm` exclusively with frozen lockfiles
5. **Testing without Verdaccio**: Never test with global npm registry; always use local-registry or e2e executor

## Helpful Commands

```bash
# View available generators for a plugin
nx list @ensono-stacks/<plugin>

# Run affected tasks (respects git changes)
nx affected -t lint build test

# Manually test a generator
nx g @ensono-stacks/<plugin>:<generator> --dry-run

# Debug E2E tests with verbose output
nx e2e <plugin>-e2e --verbose

# Check workspace graph
nx graph
```

## References

- [Stacks Documentation](https://stacks.ensono.com/docs/nx/nx_stacks)
- [Nx DevKit API](https://nx.dev/nx-api/devkit)
- [Conventional Commits](https://www.conventionalcommits.org/)
- Contributing Guide: `CONTRIBUTING.md`
- **Security & Compliance**: `.github/copilot-security-instructions.md` - Required reading for all security-related code changes
