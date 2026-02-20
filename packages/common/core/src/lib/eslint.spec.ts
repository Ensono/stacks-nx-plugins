import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import {
    readFlatEslintConfig,
    writeFlatEslintConfig,
    mergeFlatConfigs,
    getFlatConfigPath,
    mergeEslintConfig,
} from './eslint';

describe('eslint', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('getFlatConfigPath', () => {
        it('should return eslint.config.js when it exists', () => {
            tree.write('test/eslint.config.js', 'export default [];');

            const result = getFlatConfigPath(tree, 'test');

            expect(result).toBe('test/eslint.config.js');
        });

        it('should return eslint.config.mjs when it exists', () => {
            tree.write('test/eslint.config.mjs', 'export default [];');

            const result = getFlatConfigPath(tree, 'test');

            expect(result).toBe('test/eslint.config.mjs');
        });

        it('should return eslint.config.cjs when it exists', () => {
            tree.write('test/eslint.config.cjs', 'module.exports = [];');

            const result = getFlatConfigPath(tree, 'test');

            expect(result).toBe('test/eslint.config.cjs');
        });

        it('should prefer .mjs over .js when both exist', () => {
            tree.write('test/eslint.config.js', 'export default [];');
            tree.write('test/eslint.config.mjs', 'export default [];');

            const result = getFlatConfigPath(tree, 'test');

            expect(result).toBe('test/eslint.config.mjs');
        });

        it('should return null when no config file exists', () => {
            const result = getFlatConfigPath(tree, 'test');

            expect(result).toBeNull();
        });
    });

    describe('readFlatEslintConfig', () => {
        it('should parse a simple flat config array', () => {
            const configContent = `export default [
    {
        ignores: ['**/dist'],
    },
    {
        files: ['**/*.ts'],
        rules: {
            'no-console': 'error',
        },
    },
];`;

            tree.write('test/eslint.config.js', configContent);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();
            expect(result).toContain("ignores: ['**/dist']");
            expect(result).toContain("'no-console': 'error'");
        });

        it('should handle config with imports', () => {
            const configContent = `import baseConfig from '../eslint.config.js';

export default [
    ...baseConfig,
    {
        files: ['**/*.ts'],
        rules: {
            'no-console': 'off',
        },
    },
];`;

            tree.write('test/eslint.config.js', configContent);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toContain('import baseConfig');
            expect(result).toContain('...baseConfig');
        });

        it('should return null when config file does not exist', () => {
            const result = readFlatEslintConfig(tree, 'nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('writeFlatEslintConfig', () => {
        it('should write a flat config file with .mjs extension', () => {
            const configContent = `export default [
    {
        ignores: ['**/dist'],
    },
];`;

            writeFlatEslintConfig(tree, 'test', configContent);

            expect(tree.exists('test/eslint.config.mjs')).toBe(true);
            expect(tree.read('test/eslint.config.mjs', 'utf-8')).toBe(
                configContent,
            );
        });

        it('should overwrite existing config file', () => {
            tree.write('test/eslint.config.mjs', 'export default [];');

            const newConfig = `export default [
    {
        files: ['**/*.ts'],
    },
];`;

            writeFlatEslintConfig(tree, 'test', newConfig);

            expect(tree.read('test/eslint.config.mjs', 'utf-8')).toBe(
                newConfig,
            );
        });

        it('should create directory if it does not exist', () => {
            const configContent = 'export default [];';

            writeFlatEslintConfig(tree, 'new/nested/path', configContent);

            expect(tree.exists('new/nested/path/eslint.config.mjs')).toBe(true);
        });
    });

    describe('mergeFlatConfigs', () => {
        it('should merge two simple config objects', () => {
            const base = `export default [
    {
        ignores: ['**/dist'],
    },
];`;
            const override = `{
    files: ['**/*.ts'],
    rules: {
        'no-console': 'error',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain("ignores: ['**/dist']");
            expect(result).toContain("files: ['**/*.ts']");
            expect(result).toContain("'no-console': 'error'");
        });

        it('should handle configs with imports', () => {
            const base = `import tseslint from 'typescript-eslint';

export default [
    ...tseslint.configs.recommended,
];`;
            const override = `{
    files: ['**/*.ts'],
    rules: {
        'no-console': 'off',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain('import tseslint');
            expect(result).toContain('...tseslint.configs.recommended');
            expect(result).toContain("files: ['**/*.ts']");
        });

        it('should append config object to existing array', () => {
            const base = `export default [
    {
        ignores: ['**/dist'],
    },
    {
        files: ['**/*.js'],
    },
];`;
            const override = `{
    files: ['**/*.ts'],
    rules: {
        'no-console': 'error',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain("ignores: ['**/dist']");
            expect(result).toContain("files: ['**/*.js']");
            expect(result).toContain("files: ['**/*.ts']");
        });

        it('should replace config when files pattern matches', () => {
            const base = `export default [
    {
        files: ['**/*.ts'],
        rules: {
            'no-console': 'warn',
        },
    },
];`;
            const override = `{
    files: ['**/*.ts'],
    rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain("files: ['**/*.ts']");
            expect(result).toContain("'no-console': 'error'");
            expect(result).toContain(
                "'@typescript-eslint/no-explicit-any': 'error'",
            );
            // Both rules should be present (merged, not replaced)
            expect((result.match(/'no-console':/g) || []).length).toBe(1);
            expect(
                (result.match(/'@typescript-eslint\/no-explicit-any':/g) || [])
                    .length,
            ).toBe(1);
            // Ensure there's only one config with this files pattern
            expect(
                (result.match(/files: \['\*\*\/\*\.ts'\]/g) || []).length,
            ).toBe(1);
        });

        it('should replace config when name matches', () => {
            const base = `export default [
    {
        name: 'test/recommended',
        files: ['**/*.test.ts'],
        rules: {
            'jest/expect-expect': 'warn',
        },
    },
];`;
            const override = `{
    name: 'test/recommended',
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
        'jest/expect-expect': 'error',
        'jest/no-disabled-tests': 'warn',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain("name: 'test/recommended'");
            expect(result).toContain("'jest/expect-expect': 'error'");
            expect(result).toContain("'jest/no-disabled-tests': 'warn'");
            expect(result).not.toContain("'jest/expect-expect': 'warn'");
            // Ensure there's only one config with this name
            expect(
                (result.match(/name: 'test\/recommended'/g) || []).length,
            ).toBe(1);
        });

        it('should append when files pattern differs', () => {
            const base = `export default [
    {
        files: ['**/*.ts'],
        rules: {
            'no-console': 'error',
        },
    },
];`;
            const override = `{
    files: ['**/*.tsx'],
    rules: {
        'react/prop-types': 'off',
    },
}`;

            const result = mergeFlatConfigs(base, override);

            expect(result).toContain("files: ['**/*.ts']");
            expect(result).toContain("files: ['**/*.tsx']");
            expect(result).toContain("'no-console': 'error'");
            expect(result).toContain("'react/prop-types': 'off'");
        });
    });

    describe('mergeEslintConfig', () => {
        it('should create new config when none exists', () => {
            const newConfig = `import pluginA from 'eslint-plugin-a';

export default [
    {
        name: 'test/config',
        plugins: { a: pluginA },
        rules: {
            'a/rule': 'error',
        },
    },
];`;

            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBe(newConfig);
        });

        it('should add missing imports when merging', () => {
            const existingConfig = `import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    {
        name: 'existing/config',
        rules: {
            'no-console': 'error',
        },
    },
];`;

            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import pluginNew from 'eslint-plugin-new';

export default [
    ...baseConfig,
    {
        name: 'new/config',
        plugins: { new: pluginNew },
        rules: {
            'new/rule': 'error',
        },
    },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            // Should have both imports
            expect(result).toContain(
                "import baseConfig from '../../eslint.config.mjs'",
            );
            expect(result).toContain(
                "import pluginNew from 'eslint-plugin-new'",
            );

            // Should have both configs
            expect(result).toContain('existing/config');
            expect(result).toContain('new/config');
        });

        it('should not duplicate imports that already exist', () => {
            const existingConfig = `import baseConfig from '../../eslint.config.mjs';
import sharedPlugin from 'eslint-plugin-shared';

export default [
    ...baseConfig,
    {
        name: 'existing/config',
        plugins: { shared: sharedPlugin },
        rules: {
            'shared/rule': 'error',
        },
    },
];`;

            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import sharedPlugin from 'eslint-plugin-shared';

export default [
    ...baseConfig,
    {
        name: 'new/config',
        plugins: { shared: sharedPlugin },
        rules: {
            'shared/other-rule': 'warn',
        },
    },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should only have one instance of each import
            const importCount = (result!.match(/import baseConfig from/g) || [])
                .length;
            const pluginImportCount = (
                result!.match(/import sharedPlugin from/g) || []
            ).length;

            expect(importCount).toBe(1);
            expect(pluginImportCount).toBe(1);

            // Should only have one config since they use the same plugins (duplicates are merged)
            // Note: The merged config may have quoted plugin keys
            const hasPluginConfig =
                result!.includes('plugins:') &&
                result!.includes('sharedPlugin');

            expect(hasPluginConfig).toBe(true);
            // The merged config should have both rules from existing and new configs
            expect(result).toContain("'shared/rule': 'error'");
            expect(result).toContain("'shared/other-rule': 'warn'");
            // The merged config should have both names (new config overrides the name)
            expect(result).toContain('new/config');
        });

        it('should not duplicate configs with same plugins even if names differ', () => {
            const existingConfig = `import baseConfig from '../../eslint.config.mjs';
import testPlugin from 'eslint-plugin-test';

export default [
    ...baseConfig,
    {
        name: 'test/rules-old',
        plugins: { test: testPlugin },
        rules: {
            'no-console': 'error',
        },
    },
];`;

            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import testPlugin from 'eslint-plugin-test';

export default [
    ...baseConfig,
    {
        name: 'test/rules-new',
        plugins: { test: testPlugin },
        rules: {
            'no-debugger': 'error',
        },
    },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should only have one config since they use the same plugins (configs are merged)
            // Note: The merged config may have quoted plugin keys
            const hasPluginConfig =
                result!.includes('plugins:') && result!.includes('testPlugin');

            expect(hasPluginConfig).toBe(true);
            // The merged config should have the new name and both rules (old and new)
            expect(result).toContain("name: 'test/rules-new'");
            expect(result).toContain("'no-console': 'error'");
            expect(result).toContain("'no-debugger': 'error'");
        });

        it('should extract and add plugin imports correctly', () => {
            const existingConfig = `import baseConfig from '../../eslint.config.mjs';

export default [
    ...baseConfig,
    {
        name: 'existing/config',
        rules: {
            'no-console': 'error',
        },
    },
];`;

            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import nextPlugin from '@next/eslint-plugin-next';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
    ...baseConfig,
    {
        name: 'next/recommended',
        plugins: { '@next/next': nextPlugin },
        rules: {
            ...nextPlugin.configs.recommended.rules,
        },
    },
    {
        name: 'next/testing-library',
        files: ['**/*.spec.ts'],
        plugins: { 'testing-library': testingLibrary },
        rules: {
            ...testingLibrary.configs.react.rules,
        },
    },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should have the plugin imports
            expect(result).toContain(
                "import nextPlugin from '@next/eslint-plugin-next'",
            );
            expect(result).toContain(
                "import testingLibrary from 'eslint-plugin-testing-library'",
            );

            // Should only have one baseConfig import
            const baseConfigCount = (
                result!.match(/import baseConfig from/g) || []
            ).length;

            expect(baseConfigCount).toBe(1);

            // Should have all three configs
            expect(result).toContain('existing/config');
            expect(result).toContain('next/recommended');
            expect(result).toContain('next/testing-library');
        });

        it('should reuse existing import variable names when module already imported', () => {
            // Simulate @nx/next generator output
            const existingConfig = `import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];`;

            // Our generator tries to add with different variable name
            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import nextPlugin from '@next/eslint-plugin-next';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  ...baseConfig,
  {
    name: 'next/recommended',
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
  {
    name: 'next/testing-library',
    files: ['**/*.spec.ts'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should NOT add duplicate import with different variable name
            expect(result).not.toContain(
                "import nextPlugin from '@next/eslint-plugin-next'",
            );

            // Should keep original import
            expect(result).toContain(
                "import nextEslintPluginNext from '@next/eslint-plugin-next'",
            );

            // Should add testing-library import
            expect(result).toContain(
                "import testingLibrary from 'eslint-plugin-testing-library'",
            );

            // Should have the testing-library config (different plugins, not a duplicate)
            expect(result).toContain('testingLibrary.configs.react.rules');

            // The next config should be merged (same @next/next plugin)
            expect(result).toContain("name: 'next/recommended'");
        });

        it('should detect duplicate configs by plugin keys', () => {
            // Simulate @nx/next generator output with minimal plugin config
            const existingConfig = `import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
];`;

            // Our generator tries to add more complete config with same plugin
            const newConfig = `import baseConfig from '../../eslint.config.mjs';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  ...baseConfig,
  {
    name: 'next/recommended',
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should merge configs - check that plugin exists
            expect(result).toContain("'@next/next': nextEslintPluginNext");

            // The merged config should have the name and rules from the new config
            expect(result).toContain("name: 'next/recommended'");
            expect(result).toContain(
                'nextEslintPluginNext.configs.recommended.rules',
            );
        });

        it('should place name property first in merged configs', () => {
            const existingConfig = `import testPlugin from 'eslint-plugin-test';

export default [
  {
    plugins: { test: testPlugin },
    rules: {
      'no-console': 'error',
    },
  },
];`;

            const newConfig = `import testPlugin from 'eslint-plugin-test';

export default [
  {
    name: 'test/rules',
    plugins: { test: testPlugin },
    rules: {
      'no-debugger': 'error',
    },
  },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Check that name property appears before plugins
            const firstOccurrenceOfName = result!.indexOf("name: 'test/rules'");
            const firstOccurrenceOfPlugins = result!.indexOf('plugins:');

            expect(firstOccurrenceOfName).toBeGreaterThan(0);
            expect(firstOccurrenceOfName).toBeLessThan(
                firstOccurrenceOfPlugins,
            );
        });

        it('should merge configs with matching ignores', () => {
            const existingConfig = `export default [
  {
    ignores: ['**/dist', '**/node_modules'],
  },
];`;

            const newConfig = `export default [
  {
    ignores: ['next-env.d.ts', '.next/**/*', 'out/**/*'],
  },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should have merged into one config (not two separate ones)
            const ignoresConfigCount = (result!.match(/\{\s*ignores:/g) || [])
                .length;

            expect(ignoresConfigCount).toBe(1);

            // The merged config should have all ignores combined and deduplicated
            expect(result).toContain('**/dist');
            expect(result).toContain('**/node_modules');
            expect(result).toContain('next-env.d.ts');
            expect(result).toContain('.next/**/*');
            expect(result).toContain('out/**/*');
        });

        it('should merge multiple ignores-only configs from Next.js scenario', () => {
            const existingConfig = `export default [
  {
    ignores: ['.next/**/*'],
  },
];`;

            const newConfig = `export default [
  {
    ignores: ['next-env.d.ts', '.next/**/*', 'out/**/*'],
  },
];`;

            tree.write('test/eslint.config.mjs', existingConfig);
            mergeEslintConfig(tree, 'test', newConfig);

            const result = readFlatEslintConfig(tree, 'test');

            expect(result).toBeDefined();

            // Should have only one ignores config object
            const ignoresConfigCount = (result!.match(/\{\s*ignores:/g) || [])
                .length;

            expect(ignoresConfigCount).toBe(1);

            // The merged config should have all unique ignores (deduplicated)
            expect(result).toContain('next-env.d.ts');
            expect(result).toContain('.next/**/*');
            expect(result).toContain('out/**/*');

            // .next/**/* should appear only once (deduplicated)
            const nextIgnoresCount = (
                result!.match(/['"]\s*\.next\/\*\*\/\*\s*['"]/g) || []
            ).length;

            expect(nextIgnoresCount).toBe(1);
        });
    });
});
