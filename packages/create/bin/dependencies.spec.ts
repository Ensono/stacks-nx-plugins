import { execAsync, getCommandVersion } from '@ensono-stacks/core';
import yargs from 'yargs';

import {
    getStacksPlugins,
    installPackages,
    getGeneratorsToRun,
    runGenerators,
    commitGeneratedFiles,
    normaliseForwardedArgv,
} from './dependencies';
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
        'npm install -D @ensono-stacks/workspace @nrwl/next @ensono-stacks/next',
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
        'npx nx g @ensono-stacks/workspace:init',
        'folder/path',
    );
});

it('runs generators for next.js', async () => {
    const generators = getGeneratorsToRun({
        preset: 'next',
        appName: 'test-app',
    } as yargs.Arguments<CreateStacksArguments>);
    await runGenerators(generators, 'folder/path');

    expect(execAsync).toBeCalledTimes(3);
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @ensono-stacks/workspace:init',
        'folder/path',
    );
    expect(execAsync).toHaveBeenCalledWith(
        'npx nx g @nrwl/next:app test-app --e2eTestRunner=none',
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
        'git commit -m "test commit message"',
        'folder/path',
    );
});

it('replaces the Next preset with Apps', () => {
    const unparsedArguments: yargs.Arguments<Partial<CreateStacksArguments>> = {
        $0: '',
        _: [],
        preset: 'next',
        appName: 'test-app',
    };
    expect(normaliseForwardedArgv(unparsedArguments)).toMatchObject({
        $0: '',
        _: [],
        appName: 'test-app',
        preset: 'apps',
    });
});
it('does not replace a preset other than Next', () => {
    const unparsedArguments: yargs.Arguments<Partial<CreateStacksArguments>> = {
        $0: '',
        _: [],
        appName: 'test-app',
        preset: 'remix',
    };
    expect(normaliseForwardedArgv(unparsedArguments)).toMatchObject({
        $0: '',
        _: [],
        appName: 'test-app',
        preset: 'remix',
    });
});
it('does not replace a Next argument anywhere else', () => {
    const unparsedArguments: yargs.Arguments<Partial<CreateStacksArguments>> = {
        $0: '',
        _: [],
        appName: 'next',
    };
    expect(normaliseForwardedArgv(unparsedArguments)).toMatchObject({
        _: [],
        appName: 'next',
    });
});
