/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/e2e/next-e2e',
    resolve: {
        conditions: ['@ensono-stacks/source'],
    },
    test: {
        name: 'next-e2e',
        watch: false,
        globals: true,
        environment: 'node',
        hookTimeout: 360_000,
        testTimeout: 360_000,
        setupFiles: ['./setup-test.ts'],
        include: [
            '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        reporters: ['default'],
        coverage: {
            reportsDirectory: './test-output/vitest/coverage',
            provider: 'v8' as const,
        },
        globalSetup: '../../tools/scripts/local-registry.ts',
    },
}));
