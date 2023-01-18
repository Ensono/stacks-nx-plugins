import yargs from 'yargs';

import {
    getStacksPlugins,
    installPackages,
    getGeneratorsToRun,
    runGenerators,
} from './dependencies';
import { execAsync, getCommandVersion } from './exec';
import { detectPackageManager } from './package-manager';

beforeEach(() => {
    jest.clearAllMocks();
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
        'npx nx g @ensono-stacks/workspace:init',
        'folder/path',
    );
});

it('skips running generators if there are no generators defined', async () => {
    await runGenerators([], 'folder/path');

    expect(execAsync).toBeCalledTimes(0);
});

it('runs generators with preferred package manager', async () => {
    (getCommandVersion as jest.Mock).mockImplementation(() => '7.0.0');
    (detectPackageManager as jest.Mock).mockImplementation(() => 'pnpm');
    await runGenerators(['@ensono-stacks/workspace:init'], 'folder/path');

    expect(execAsync).toBeCalledTimes(1);
    expect(execAsync).toHaveBeenCalledWith(
        'pnpm exec nx g @ensono-stacks/workspace:init',
        'folder/path',
    );
});
