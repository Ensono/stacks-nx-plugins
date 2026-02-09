/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/create',
    plugins: [],
    resolve: {
        conditions: ['@ensono-stacks/source'],
    },
    test: {
        name: 'create',
        watch: false,
        globals: true,
        pool: 'forks',
        environment: 'node',
        testTimeout: 60_000,
        hookTimeout: 60_000,
        include: [
            '{src,bin,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        setupFiles: ['./setup-test.ts'],
        reporters: ['default'],
        coverage: {
            reportsDirectory: './test-output/vitest/coverage',
            provider: 'v8' as const,
        },
    },
}));
