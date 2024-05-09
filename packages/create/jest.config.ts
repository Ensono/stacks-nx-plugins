export default {
    displayName: 'create',
    preset: '../../jest.preset.js',
    globals: {},
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
    setupFilesAfterEnv: ['./setup-test.ts'],
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/packages/create',
};
