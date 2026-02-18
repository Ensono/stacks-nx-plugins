# Contract: Vite Build Configuration Per Package

## `vite.config.ts` (per package)

Each buildable package under `packages/` receives a `vite.config.ts` that
configures Vite library mode for building.

### Required Shape

```typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { buildVersionDefineMap } from '../../tools/versions';

export default defineConfig(() => ({
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/packages/<name>',

    plugins: [
        nxViteTsPaths(),
        nxCopyAssetsPlugin(['*.md', '*.json', '*.ejs', '**/*.d.ts']),
        dts({
            entryRoot: 'src',
            tsconfigPath: './tsconfig.lib.json',
        }),
    ],

    define: buildVersionDefineMap(),

    build: {
        outDir: 'dist',
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs'],
            fileName: 'index',
        },
        rollupOptions: {
            external: [/node_modules/, /^@nx\//, /^@ensono-stacks\//],
        },
    },
}));
```

### Invariants

- `root` is always `import.meta.dirname`
- `build.lib` is always present (required for `@nx/vite` to detect as buildable)
- `define` always calls `buildVersionDefineMap()` to get version replacements
- `build.rollupOptions.external` externalises all node_modules dependencies
- `plugins` always includes `nxViteTsPaths()`, `nxCopyAssetsPlugin(...)`, and
  `dts(...)`
- Output format is CJS to match current build output
- `outDir` is `'dist'` (relative to package root, i.e. `packages/<name>/dist`)

### Package-Specific Variations

| Package                | Additional Notes                              |
| ---------------------- | --------------------------------------------- |
| `packages/common/core` | Path depth differs: `../../../tools/versions` |
| `packages/common/test` | Path depth differs: `../../../tools/versions` |
| `packages/common/e2e`  | **No `vite.config.ts`** — not buildable       |
| All others             | Standard: `../../tools/versions`              |

---

## nx.json Plugin Registration

### Required Shape

```json
{
    "plugin": "@nx/vite",
    "include": ["packages/**/*"],
    "exclude": ["e2e/**/*"],
    "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "ciTargetName": "test-ci"
    }
}
```

### Invariants

- Must appear in the plugins array
- `include` restricts to packages only (not e2e)
- `buildTargetName` must be `build` to match existing conventions
- test target names match existing vitest conventions

---

## project.json Changes

### Removals

The explicit `build` target (using `@nx/js:tsc` executor) is removed from every
`project.json` under `packages/`. The inferred build target from `@nx/vite`
replaces it.

### Retained

The `lint` target configuration remains in `project.json` (or can stay as
inferred from `@nx/eslint/plugin`).

### Before

```json
{
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": { ... }
    },
    "lint": { ... }
  }
}
```

### After

```json
{
  "targets": {
    "lint": { ... }
  }
}
```

The `build` target is now inferred by `@nx/vite` from the presence of
`vite.config.ts`.
