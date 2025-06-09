/* eslint-disable */
export default {
    displayName: 'create-e2e',
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
    coverageDirectory: '../../coverage/e2e/create-e2e',
    globalSetup: '../../tools/scripts/start-local-registry.ts',
    globalTeardown: '../../tools/scripts/stop-local-registry.ts',
};
