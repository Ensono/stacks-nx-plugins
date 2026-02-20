# Contract: Version Name Transform

## `toVersionKey(packageName: string): string`

Transforms an npm package name into a valid `__versions__` property access
expression.

### Inputs

| Parameter     | Type     | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `packageName` | `string` | A valid npm package name (scoped or unscoped) |

### Output

| Type     | Description                                                   |
| -------- | ------------------------------------------------------------- |
| `string` | Property access expression: `__versions__.<transformed_name>` |

### Transform Rules (ordered)

1. Strip leading `@` character
2. Replace all `/` with `$`
3. Replace all `-` with `_`
4. Replace all `.` with `_`

### Contract Examples

| Input                         | Output                                    |
| ----------------------------- | ----------------------------------------- |
| `axios`                       | `__versions__.axios`                      |
| `@tanstack/react-query`       | `__versions__.tanstack$react_query`       |
| `@commitlint/cli`             | `__versions__.commitlint$cli`             |
| `@auth/core`                  | `__versions__.auth$core`                  |
| `next-auth`                   | `__versions__.next_auth`                  |
| `eslint-plugin-security`      | `__versions__.eslint_plugin_security`     |
| `@storybook/nextjs`           | `__versions__.storybook$nextjs`           |
| `@applitools/eyes-playwright` | `__versions__.applitools$eyes_playwright` |
| `vite-plugin-dts`             | `__versions__.vite_plugin_dts`            |
| `ts-morph`                    | `__versions__.ts_morph`                   |
| `uuid`                        | `__versions__.uuid`                       |
| `@types/uuid`                 | `__versions__.types$uuid`                 |

### Invariants

- Output always starts with `__versions__.`
- The portion after `__versions__.` matches `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/`
  (valid JS identifier)
- The transform is deterministic and reversible (given the rules)
- No two distinct package names may produce the same output (guaranteed by the
  character mapping being injective)

---

## `buildVersionDefineMap(): Record<string, string>`

Reads `generatorDependencyVersions` from `tools/versions.ts` and produces a Vite
`define` compatible map.

### Inputs

None (reads from the central version source at import time).

### Output

| Type                     | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `Record<string, string>` | Map of `__versions__.<key>` → `JSON.stringify(version)` |

### Contract Examples

Given `generatorDependencyVersions`:

```typescript
{
  'axios': '1.7.7',
  '@tanstack/react-query': '^5.90.20',
}
```

Output:

```typescript
{
  '__versions__.axios': '"1.7.7"',
  '__versions__.tanstack$react_query': '"^5.90.20"',
}
```

### Invariants

- Every entry in `generatorDependencyVersions` produces exactly one entry in the
  output
- Values are always `JSON.stringify(version)` — double-quoted strings within the
  string
- Keys match the `toVersionKey` contract above

---

## `generatorDependencyVersions: Record<string, string>`

The central version registry.

### Location

`tools/versions.ts`

### Schema

```typescript
export const generatorDependencyVersions: Record<string, string> = {
  [npmPackageName: string]: semverVersionString
};
```

### Constraints

- Every key MUST be a valid npm package name
- Every value MUST be a valid semver version string or range
- Every key SHOULD have a corresponding entry in root `package.json`
  `devDependencies`
- Entries MUST NOT duplicate dependencies that are only used by the monorepo
  itself (not by generators)
