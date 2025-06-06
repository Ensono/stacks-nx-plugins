const nxPreset = require('@nx/jest/preset').default;

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
};
