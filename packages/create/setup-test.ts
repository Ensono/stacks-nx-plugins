jest.mock('./bin/package-manager', () => ({
    __esModule: true,
    ...jest.requireActual('./bin/package-manager'),
    detectPackageManager: jest.fn(() => 'npm'),
}));

jest.mock('./bin/exec', () => ({
    execAsync: jest.fn(),
    getCommandVersion: jest.fn(() => '1.0.0'),
}));
