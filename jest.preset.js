const nxPreset = require('@nx/jest/preset').default;

// Set NODE_OPTIONS for experimental VM modules (required for Prettier 3.x)
process.env.NODE_OPTIONS = '--experimental-vm-modules';

module.exports = {
    ...nxPreset,
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
    // Enable experimental VM modules for ESM support (required for Prettier 3.x dynamic imports)
    testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons'],
    },
};
