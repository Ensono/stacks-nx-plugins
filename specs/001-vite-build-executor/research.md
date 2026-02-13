# Research: Vite Build Executor with Centralised Dependency Versions

**Date**: 9 February 2026

## R1: How @nx/vite Infers Build Tasks

### Decision

Register the `@nx/vite` plugin in `nx.json` and add a `vite.config.ts` file to
each buildable package. The `@nx/vite` plugin detects
`**/{vite,vitest}.config.{js,ts,mjs,mts,cjs,cts}` and infers build/serve/preview
targets from **non-vitest** config files when the project is "buildable" (i.e.,
has `build.lib` defined).

### Rationale

- The `@nx/vite` plugin already coexists with `@nx/vitest` — both use the same
  glob, but vitest configs only produce test targets while vite configs produce
  build targets.
- Since each package already has `vitest.config.mts` (test-only), adding
  `vite.config.ts` (build-only) gives clean separation.
- The `@nx/vite` plugin automatically handles caching, inputs, outputs, and
  dependency ordering via inferred task configuration.
- Plugin order matters: `@nx/vite` must appear **before** `@nx/js/typescript` in
  the plugins array so that the Vite-inferred `build` target takes precedence
  over the TypeScript-inferred `build` target. Alternatively,
  `@nx/js/typescript` build inference can be removed/renamed.

### Key Implementation Details

The `@nx/vite` plugin source (`node_modules/@nx/vite/src/plugins/plugin.js`)
checks `isBuildable`:

```
Boolean(build?.lib || builder?.buildApp || build?.rollupOptions?.input || existsSync('index.html'))
```

So each `vite.config.ts` MUST include `build.lib` (library mode). This means:

```typescript
build: {
  lib: {
    entry: 'src/index.ts',
    formats: ['cjs'],
    fileName: 'index',
  },
}
```

The plugin normalizes options with defaults:

- `buildTargetName: 'build'`
- `serveTargetName: 'serve'`
- `previewTargetName: 'preview'`
- `testTargetName: 'test'`

Register in `nx.json`:

```json
{
    "plugin": "@nx/vite",
    "include": ["packages/**/*"],
    "exclude": ["e2e/**/*"],
    "options": {
        "buildTargetName": "build"
    }
}
```

### Alternatives Considered

1. **Explicit `@nx/vite:build` executor in project.json** — Rejected because
   inferred tasks are the recommended Nx pattern and reduce per-project
   boilerplate.
2. **Use `@rollup/plugin-replace`** — Rejected because Vite's built-in `define`
   config handles string replacement natively during both dev and build.
3. **Keep `@nx/js:tsc` with a post-build script** — Rejected because it doesn't
   integrate with build-time replacement and adds complexity.

---

## R2: Vite `define` for Version Replacement

### Decision

Use Vite's `define` configuration option to replace version constants at build
time. Each package's `vite.config.ts` will read version entries from a central
source and produce a `define` map.

### Rationale

From Vite docs: "Define global constant replacements. Entries will be defined as
globals during dev and statically replaced during build." Value expressions must
be JSON-serializable values.

For version strings, the define config looks like:

```typescript
define: {
  '__versions__.tanstack$react_query': JSON.stringify('^5.90.20'),
  '__versions__.axios': JSON.stringify('1.7.7'),
}
```

Vite uses esbuild `define` under the hood, which performs literal text
replacement during the build transform step.

### Key Implementation Details

**Naming convention for the `define` keys** (per user requirement):

| Package name            | `__versions__` key                  |
| ----------------------- | ----------------------------------- |
| `@tanstack/react-query` | `__versions__.tanstack$react_query` |
| `@org/some-package`     | `__versions__.org$some_package`     |
| `another-package`       | `__versions__.another_package`      |
| `axios`                 | `__versions__.axios`                |

**Transform rules**:

1. Strip leading `@` if scoped
2. Replace `/` with `$` (scope separator)
3. Replace `-` with `_`
4. Replace `.` with `_`

The transform function:

```typescript
function toVersionKey(packageName: string): string {
    return (
        '__versions__.' +
        packageName.replace(/^@/, '').replace(/\//g, '$').replace(/[-\.]/g, '_')
    );
}
```

**TypeScript support**: A `versions.d.ts` declaration file will declare the
`__versions__` namespace so TypeScript doesn't error on undeclared globals:

```typescript
declare const __versions__: {
    readonly [key: string]: string;
};
```

### Alternatives Considered

1. **`import.meta.env.VITE_*` environment variables** — Rejected because env
   vars require a `VITE_` prefix, are string-only, and don't map naturally to
   package-scoped names. Also, they are designed for app code, not library
   builds.
2. **A custom Vite plugin using `transform()` hook** — Rejected because `define`
   is built-in, well-documented, and handles the use case perfectly.
3. **`@rollup/plugin-replace`** — Rejected because it's an additional dependency
   when Vite already has `define`.

---

## R3: Central Version Source Location

### Decision

Create a `tools/versions.ts` file that exports a `Record<string, string>`
mapping npm package names to version strings. This file is consumed by each
package's `vite.config.ts` at build time. Additionally, every package referenced
in `tools/versions.ts` is added to the root `package.json` `devDependencies`
section so that Dependabot can scan them.

### Rationale

- `tools/` is an existing directory in the workspace used for build tooling
- A TypeScript file allows type safety and IDE autocompletion
- The root `package.json` `devDependencies` is the standard location Dependabot
  scans
- The root `package.json` is the authoritative source — if a dependency exists
  there with a different version, the `package.json` version wins and
  `tools/versions.ts` is updated to match
- A build-time validation step can verify that all entries in
  `tools/versions.ts` match their root `package.json` counterparts

### Structure

```typescript
// tools/versions.ts
/**
 * Central registry of dependency versions installed by generators.
 * These are NOT runtime dependencies of the plugins themselves — they are
 * versions that generators install into consumer projects.
 *
 * To add a new version:
 * 1. Add the entry here
 * 2. Add the package to root package.json devDependencies at the same version
 * 3. Reference it in your generator via __versions__.package_name
 */
export const generatorDependencyVersions: Record<string, string> = {
    // Workspace / commitlint / eslint
    husky: '^9.1.7',
    '@commitlint/cli': '19.3.0',
    '@commitlint/config-conventional': '19.2.2',
    // ... all other entries

    // Next.js / auth
    'next-auth': '5.0.0-beta.28',
    '@auth/core': '0.39.1',

    // Rest client
    axios: '1.7.7',
    orval: '6.28.2',
    // ...
};
```

### Alternatives Considered

1. **Root `package.json` as the sole source** — Rejected because reading
   `package.json` at build time mixes generator-installed versions with actual
   dev dependencies. No way to distinguish which deps are for generators vs. the
   monorepo itself.
2. **A separate `versions.json`** — Rejected because `.ts` provides better DX
   (type checking, comments, IDE support) and can be imported directly by vite
   config.
3. **Inline in each `vite.config.ts`** — Rejected because this defeats the
   purpose of centralisation.

---

## R4: TypeScript Declaration Generation with Vite

### Decision

Use the `vite-plugin-dts` plugin to generate `.d.ts` declaration files during
the Vite build. This is already a devDependency pattern in the Nx ecosystem.

### Rationale

- The current `@nx/js:tsc` executor generates declarations as part of the
  TypeScript compilation
- Vite uses esbuild for transforms (which strips types but doesn't emit
  declarations)
- `vite-plugin-dts` fills this gap by running `tsc` for declaration emission
  only
- The Nx documentation explicitly recommends this plugin for library builds

### Configuration

```typescript
import dts from 'vite-plugin-dts';

// In vite.config.ts plugins array:
dts({
    entryRoot: 'src',
    tsconfigPath: './tsconfig.lib.json',
});
```

### Alternatives Considered

1. **Separate `tsc --emitDeclarationOnly` step** — Rejected because it adds a
   second build step and complicates the build pipeline. `vite-plugin-dts`
   integrates this into the Vite build.
2. **Skip declarations entirely** — Not viable; published npm packages require
   type declarations.

---

## R5: Asset Copying (Non-TypeScript Files)

### Decision

Use `nxCopyAssetsPlugin` from `@nx/vite/plugins/nx-copy-assets.plugin` to copy
non-TypeScript assets (EJS templates, JSON schemas, markdown files, `.d.ts`
template files) to the build output.

### Rationale

The current `@nx/js:tsc` build config copies assets via:

```json
"assets": [
  { "input": "./packages/<name>/src", "glob": "**/!(*.ts)", "output": "." },
  { "input": "./packages/<name>/src", "glob": "**/*.d.ts", "output": "." }
]
```

The `nxCopyAssetsPlugin` provides equivalent functionality within Vite:

```typescript
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

plugins: [nxCopyAssetsPlugin(['*.md', '*.json', '*.ejs', '*.d.ts'])];
```

Alternatively, Vite's `publicDir` could be used, but that doesn't support
glob-based file selection from `src/`.

### Alternatives Considered

1. **Vite `publicDir`** — Rejected because it copies an entire directory as-is
   to the root of outDir. The assets are in `src/` alongside TS files and need
   selective copying.
2. **`vite-plugin-static-copy`** — Rejected because `nxCopyAssetsPlugin` is
   Nx-native and already handles the workspace conventions.

---

## R6: Handling the vitest.config.mts / vite.config.ts Overlap

### Decision

Keep the existing `vitest.config.mts` files for test configuration and add
separate `vite.config.ts` files for build configuration. The `@nx/vite` plugin
processes both but creates different targets from each.

### Rationale

The `@nx/vite` plugin source code shows:

- If `configFilePath.includes('vitest.config')` → creates test targets only
- If NOT vitest config AND `isBuildable` → creates build/serve/preview targets

This means both files can coexist. The `@nx/vitest` plugin entries in `nx.json`
can be **removed** because their functionality is subsumed by `@nx/vite` (which
handles both vitest and vite configs).

### Important Note

When `@nx/vite` is registered, it will infer test targets from
`vitest.config.mts` files AND build targets from `vite.config.ts` files. The
existing `@nx/vitest` registrations can be replaced by `@nx/vite` with the same
options structure, since `@nx/vite` normalizes the same target name options.

### Alternatives Considered

1. **Merge test config into vite.config.ts** — Rejected because it creates a
   single bloated config file that mixes build and test concerns.
2. **Use `@nx/vitest` alongside `@nx/vite`** — This would work but is redundant
   since `@nx/vite` already handles vitest config detection. Removing
   `@nx/vitest` reduces plugin processing.

---

## R7: Conflict with @nx/js/typescript Inferred Build

### Decision

Remove or rename the `build` target from the `@nx/js/typescript` plugin
registration in `nx.json` to avoid conflict with the `@nx/vite` inferred build
target.

### Rationale

Currently `nx.json` registers:

```json
{
    "plugin": "@nx/js/typescript",
    "options": {
        "build": {
            "targetName": "build",
            "configName": "tsconfig.lib.json"
        }
    }
}
```

This infers a `build` target from `tsconfig.lib.json`. If `@nx/vite` also infers
a `build` target from `vite.config.ts`, there will be a conflict. Options:

1. **Remove the `build` section** from `@nx/js/typescript` options (keep only
   `typecheck`)
2. **Rename one target** (e.g., `tsc-build` vs `build`)
3. **Rely on plugin order** — place `@nx/vite` after `@nx/js/typescript` so Vite
   wins

Option 1 is cleanest: `@nx/js/typescript` provides `typecheck` only, `@nx/vite`
provides `build`.

### Implementation

```json
{
    "plugin": "@nx/js/typescript",
    "options": {
        "typecheck": {
            "targetName": "typecheck"
        }
    }
}
```

The explicit `@nx/js:tsc` entries in each `project.json` build target must also
be removed, since the inferred Vite build replaces them.

---

## R8: Package Name to Version Key Transform

### Decision

Implement a `toVersionKey(packageName: string)` utility that transforms npm
package names into valid JavaScript property access expressions under the
`__versions__` namespace.

### Rationale

Vite's `define` requires valid identifier-like keys for dot-notation access. npm
package names can contain `@`, `/`, `-`, and `.` which are not valid in
JavaScript identifiers.

### Transform Rules

| Character   | Replacement | Reason                                               |
| ----------- | ----------- | ---------------------------------------------------- |
| Leading `@` | Strip       | Scope prefix not needed in identifier                |
| `/`         | `$`         | Scope separator → dollar sign (valid in identifiers) |
| `-`         | `_`         | Hyphen → underscore                                  |
| `.`         | `_`         | Dot → underscore (avoids nested property access)     |

### Examples

| Input                         | Output                                    |
| ----------------------------- | ----------------------------------------- |
| `@tanstack/react-query`       | `__versions__.tanstack$react_query`       |
| `@commitlint/cli`             | `__versions__.commitlint$cli`             |
| `@auth/core`                  | `__versions__.auth$core`                  |
| `next-auth`                   | `__versions__.next_auth`                  |
| `axios`                       | `__versions__.axios`                      |
| `ioredis`                     | `__versions__.ioredis`                    |
| `@storybook/nextjs`           | `__versions__.storybook$nextjs`           |
| `eslint-plugin-security`      | `__versions__.eslint_plugin_security`     |
| `@applitools/eyes-playwright` | `__versions__.applitools$eyes_playwright` |

### Implementation

```typescript
export function toVersionKey(packageName: string): string {
    return (
        '__versions__.' +
        packageName.replace(/^@/, '').replace(/\//g, '$').replace(/[-\.]/g, '_')
    );
}
```

This function lives in `tools/versions.ts` and is shared by all `vite.config.ts`
files.
