const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

module.exports = {
    ...nxPreset,
    // Use custom resolver to fix .d.ts loading issue in Nx 22
    resolver: path.join(__dirname, 'tools/jest-resolver.js'),
    testTimeout: 180_000,
    coverageReporters: ['text', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    // Transform @nx packages to handle ESM imports in Nx 22+
    transformIgnorePatterns: ['node_modules/(?!@nx)'],
};
