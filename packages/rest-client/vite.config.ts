/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { buildVersionDefineMap } from '../../tools/versions';

export default defineConfig(() => ({
    root: path.resolve(__dirname, 'src'),
    cacheDir: '../../node_modules/.vite/packages/rest-client',
    plugins: [
        nxViteTsPaths(),
        nxCopyAssetsPlugin([
            '**/*.d.ts',
            '**/files/**',
            'generators/**/*.json',
        ]),
        dts({
            entryRoot: '.',
            tsconfigPath: '../tsconfig.lib.json',
        }),
    ],
    define: buildVersionDefineMap(),
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        lib: {
            entry: 'index.ts',
            fileName(format, entryName) {
                return `${entryName}.js`;
            },
        },
        rollupOptions: {
            output: [
                {
                    format: 'cjs',
                    dir: 'dist',
                    preserveModulesRoot: 'src',
                    preserveModules: true,
                },
            ],
            external: id =>
                !id.startsWith('.') &&
                !id.startsWith('/') &&
                !id.startsWith('\0'),
        },
    },
}));
