/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/e2e/azure-node-e2e',
    resolve: {
        conditions: ['@ensono-stacks/source'],
    },
    test: {
        name: 'azure-node-e2e',
        watch: false,
        globals: true,
        environment: 'node',
        hookTimeout: 180_000,
        testTimeout: 180_000,
        include: ['{src,tests}/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        reporters: ['default'],
        coverage: {
            reportsDirectory: './test-output/vitest/coverage',
            provider: 'v8' as const,
        },
        globalSetup: '../../tools/scripts/local-registry.ts',
    },
}));
