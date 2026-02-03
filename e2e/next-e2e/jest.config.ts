/* eslint-disable */
module.exports = {
    displayName: 'next-e2e',
    preset: '../../jest.preset.js',
    globals: {},
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/e2e/next-e2e',
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    globalSetup: '../../tools/scripts/start-local-registry.ts',
    globalTeardown: '../../tools/scripts/stop-local-registry.ts',
};
