jest.mock('./bin/package-manager', () => ({
    __esModule: true,
    ...jest.requireActual('./bin/package-manager'),
    detectPackageManager: jest.fn(() => 'npm'),
}));

jest.mock('@ensono-stacks/core', () => ({
    ...jest.requireActual('@ensono-stacks/core'),
    execAsync: jest.fn(),
    getCommandVersion: jest.fn(() => '1.0.0'),
}));
