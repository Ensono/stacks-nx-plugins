const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
    ...nxPreset,
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
