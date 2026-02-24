---
name: link-workspace-packages
description: Link workspace packages in monorepos (npm, yarn, pnpm, bun). USE WHEN: (1) you just created or generated new packages and need to wire up their dependencies, (2) user imports from a sibling package and needs to add it as a dependency, (3) you get resolution errors for workspace packages (@org/*) like "cannot find module", "failed to resolve import", "TS2307", or "cannot resolve". DO NOT patch around with tsconfig paths or manual package.json edits - use the package managers workspace commands to fix actual linking.
---

# Link Workspace Packages

Add dependencies between packages in a monorepo. All package managers support
workspaces but with different syntax.

## Workflow

1. Identify consumer package (the one importing)
2. Identify provider package(s) (being imported)
3. Add dependency using package manager's workspace syntax
4. Verify symlinks created in consumer's `node_modules/`

---

Uses `workspace:` protocol - symlinks only created when explicitly declared.

```bash
# From consumer directory
pnpm add @org/ui --workspace

# Or with --filter from anywhere
pnpm add @org/ui --filter @org/app --workspace
```

Result in `package.json`:

```json
{ "dependencies": { "@org/ui": "workspace:*" } }
```
---

## Examples

**Example 1: pnpm - link ui lib to app**

```bash
pnpm add @org/ui --filter @org/app --workspace
```

**Example 2: Debug "Cannot find module"**

1. Check if dependency is declared in consumer's `package.json`
2. If not, add it using appropriate command above
3. Run install `pnpm install`

## Notes

- Symlinks appear in `<consumer>/node_modules/@org/<package>`
- no hoisting (strict isolation, prevents phantom deps)
- Root `package.json` should have `"private": true` to prevent accidental
  publish
