# Data Model: Vite Build Executor with Centralised Dependency Versions

## Entities

### GeneratorDependencyVersions

**Location**: `tools/versions.ts`  
**Type**: `Record<string, string>`  
**Purpose**: Single source of truth mapping npm package names to semver version
strings.

| Field              | Type     | Description                           | Example                 |
| ------------------ | -------- | ------------------------------------- | ----------------------- |
| key (package name) | `string` | npm package name (scoped or unscoped) | `@tanstack/react-query` |
| value (version)    | `string` | Semver string or range                | `^5.90.20`              |

**Validation Rules**:

- Key must be a valid npm package name
- Value must be a valid semver string or range
- Every key must have a corresponding entry in root `package.json`
  devDependencies

---

### VersionDefineMap

**Type**: `Record<string, string>` (Vite `define` config value)  
**Purpose**: Build-time constant replacement map derived from
GeneratorDependencyVersions.

| Field | Type     | Description                       | Example                             |
| ----- | -------- | --------------------------------- | ----------------------------------- |
| key   | `string` | `__versions__.<transformed_name>` | `__versions__.tanstack$react_query` |
| value | `string` | `JSON.stringify(version)`         | `'"^5.90.20"'`                      |

**Transform rules** (package name → key):

1. Strip leading `@`
2. Replace `/` with `$`
3. Replace `-` and `.` with `_`

---

### ViteConfigPerPackage

**Location**: `packages/<name>/vite.config.ts`  
**Purpose**: Per-package Vite build configuration with define map.

| Field                          | Type                     | Description                                                  |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ |
| `root`                         | `string`                 | `import.meta.dirname`                                        |
| `cacheDir`                     | `string`                 | Relative path to `.vite` cache                               |
| `plugins`                      | `Plugin[]`               | `nxViteTsPaths()`, `nxCopyAssetsPlugin([...])`, `dts({...})` |
| `define`                       | `Record<string, string>` | Version define map from `buildVersionDefineMap()`            |
| `build.outDir`                 | `string`                 | Relative path to dist output                                 |
| `build.lib`                    | `LibraryOptions`         | Library entry point, format, filename                        |
| `build.rollupOptions.external` | `RegExp[]`               | Externalize all node_modules                                 |

---

### NxPluginRegistration

**Location**: `nx.json` plugins array  
**Purpose**: Register `@nx/vite` as inferred task provider for packages.

| Field                     | Type       | Description         |
| ------------------------- | ---------- | ------------------- |
| `plugin`                  | `string`   | `@nx/vite`          |
| `include`                 | `string[]` | `["packages/**/*"]` |
| `exclude`                 | `string[]` | `["e2e/**/*"]`      |
| `options.buildTargetName` | `string`   | `build`             |

---

## Relationships

```
tools/versions.ts (GeneratorDependencyVersions)
  ├──→ read by: packages/*/vite.config.ts (at build time)
  ├──→ synced with: package.json devDependencies (source of truth; version wins on conflict)
  └──→ consumed via: __versions__.* globals (in generator source code)

nx.json (@nx/vite plugin)
  └──→ detects: packages/*/vite.config.ts → infers build target

packages/*/vite.config.ts
  ├──→ defines: __versions__.* → literal strings
  ├──→ uses: vite-plugin-dts → .d.ts emission
  ├──→ uses: nxCopyAssetsPlugin → asset copying
  └──→ replaces: project.json explicit build target
```

## State Transitions

The version constant lifecycle:

1. **Source**: `tools/versions.ts` — package name → version string
2. **Build-time**: `vite.config.ts` — `define` map with `__versions__.*` keys
3. **Generator source**: References `__versions__.package_name` in code
4. **Compiled output**: Literal string `"^5.90.20"` (no variable reference)
