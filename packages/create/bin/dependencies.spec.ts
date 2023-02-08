import yargs from 'yargs';

import {
    getStacksPlugins,
    installPackages,
    getGeneratorsToRun,
    runGenerators,
    commitGeneratedFiles,
} from './dependencies';
import { execAsync, getCommandVersion } from './exec';
import { detectPackageManager } from './package-manager';
import type { CreateStacksArguments } from './types';

beforeEach(() => {
    jest.clearAllMocks();
});

it('installs dependencies correctly', async () => {
    const packages = getStacksPlugins(
        {} as yargs.Arguments<CreateStacksArguments>,
    );
    await installPackages(packages, 'folder/path');

    expect(execAsync).toHaveBeenCalledWith(
        'npm install -D @ensono-stacks/workspace',
        'folder/path',
    );
});

it('installs dependencies for next.js', async () => {
    const packages = getStacksPlugins({
        preset: 'next',
    } as yargs.Arguments<CreateStacksArguments>);
    await installPackages(packages, 'folder/path');

    expect(execAsync).toHaveBeenCalledWith(
        'npm install -D @ensono-stacks/workspace @ensono-stacks/next',
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
    const generators = getGeneratorsToRun(
        {} as yargs.Arguments<CreateStacksArguments>,
    );
    await runGenerators(generators, 'folder/path');

    expect(execAsync).toBeCalledTimes(1);
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @ensono-stacks/workspace:init --pipelineRunner=none',
        'folder/path',
    );
});

it('runs generators for next.js', async () => {
    const generators = getGeneratorsToRun({
        preset: 'next',
        appName: 'test-app',
    } as yargs.Arguments<CreateStacksArguments>);
    await runGenerators(generators, 'folder/path');

    expect(execAsync).toBeCalledTimes(2);
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @ensono-stacks/workspace:init --pipelineRunner=none',
        'folder/path',
    );
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @ensono-stacks/next:init --project=test-app',
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

it('commits additional generator files', async () => {
    await commitGeneratedFiles('folder/path', 'test commit message');
    expect(execAsync).toBeCalledTimes(3);
    expect(execAsync).toHaveBeenNthCalledWith(
        1,
        'cd folder/path',
        'folder/path',
    );
    expect(execAsync).toHaveBeenNthCalledWith(2, 'git add .', 'folder/path');
    expect(execAsync).toHaveBeenNthCalledWith(
        3,
        'HUSKY=0 git commit -m "test commit message"',
        'folder/path',
    );
});
