import yargs from 'yargs';

import {
    getStacksPlugins,
    installPackages,
    getGeneratorsToRun,
    runGenerators,
} from './dependencies';
import { execAsync } from './exec';
import {
    detectPackageManager,
    getPackageManagerVersion,
} from './package-manager';

jest.mock('./exec', () => ({
    execAsync: jest.fn(),
}));

jest.mock('./package-manager', () => ({
    ...jest.requireActual('./package-manager'),
    detectPackageManager: jest.fn(() => 'npm'),
    getPackageManagerVersion: jest.fn(() => '1.0.0'),
}));

beforeEach(() => {
    jest.resetAllMocks();
});

it('installs dependencies correctly', async () => {
    const packages = getStacksPlugins({} as yargs.Arguments);
    await installPackages(packages, 'folder/path');

    expect(execAsync).toHaveBeenCalledWith(
        'npm install -D @ensono-stacks/workspace',
        'folder/path',
    );
});

it('skips install if there are no packages defined', async () => {
    await installPackages([], 'folder/path');

    expect(execAsync).toBeCalledTimes(0);
});

it('installs dependencies with preferred package manager', async () => {
    (detectPackageManager as jest.Mock).mockImplementationOnce(() => 'yarn');
    await installPackages(['@ensono-stacks/workspace'], 'folder/path');

    expect(execAsync).toHaveBeenCalledWith(
        'yarn add -D @ensono-stacks/workspace',
        'folder/path',
    );
});

it('runs generators correctly', async () => {
    const generators = getGeneratorsToRun({} as yargs.Arguments);
    await runGenerators(generators, 'folder/path');

    expect(execAsync).toBeCalledTimes(1);
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @ensono-stacks/workspace:install',
        'folder/path',
    );
});

it('skips running generators if there are no generators defined', async () => {
    await runGenerators([], 'folder/path');

    expect(execAsync).toBeCalledTimes(0);
});

it('runs generators with preferred package manager', async () => {
    (getPackageManagerVersion as jest.Mock).mockImplementationOnce(
        () => '7.0.0',
    );
    (detectPackageManager as jest.Mock).mockImplementationOnce(() => 'pnpm');
    await runGenerators(['@ensono-stacks/workspace:install'], 'folder/path');

    expect(execAsync).toBeCalledTimes(2);
    expect(execAsync).toHaveBeenCalledWith(
        'pnpm exec nx g @ensono-stacks/workspace:install',
        'folder/path',
    );
    expect(execAsync).toHaveBeenCalledWith(
        'pnpm exec nx g @ensono-stacks/rest-client:install',
        'folder/path',
    );
});
