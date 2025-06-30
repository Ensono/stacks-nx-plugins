import { execAsync, getCommandVersion } from '@ensono-stacks/core';
import yargs from 'yargs';

import {
    getStacksPlugins,
    installPackages,
    getGeneratorsToRun,
    runGenerators,
    normaliseForwardedArgv,
} from './dependencies';
import { detectPackageManager } from './package-manager';
// eslint-disable-next-line unicorn/prevent-abbreviations
import { CreateStacksArguments, E2eTestRunner } from './types';

describe('workspace generator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('installs dependencies correctly', async () => {
        const packages = getStacksPlugins({
            e2eTestRunner: E2eTestRunner.None,
        } as yargs.Arguments<CreateStacksArguments>);
        await installPackages(packages, 'folder/path');

        expect(execAsync).toHaveBeenCalledWith(
            'npm install -D @ensono-stacks/workspace@latest',
            'folder/path',
        );
    });

    it('installs dependencies for next.js', async () => {
        const packages = getStacksPlugins({
            preset: 'next',
            e2eTestRunner: E2eTestRunner.None,
        } as yargs.Arguments<CreateStacksArguments>);
        await installPackages(packages, 'folder/path');

        expect(execAsync).toHaveBeenCalledWith(
            'npm install -D @ensono-stacks/workspace@latest @nx/next @ensono-stacks/next@latest',
            'folder/path',
        );
    });

    it('skips install if there are no packages defined', async () => {
        await installPackages([], 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(0);
    });

    it('installs dependencies with preferred package manager', async () => {
        (detectPackageManager as jest.Mock).mockImplementationOnce(
            () => 'yarn',
        );
        await installPackages(['@ensono-stacks/workspace'], 'folder/path');

        expect(execAsync).toHaveBeenCalledWith(
            'yarn add -D @ensono-stacks/workspace@latest',
            'folder/path',
        );
    });

    it('runs generators correctly', async () => {
        const generators = getGeneratorsToRun({
            e2eTestRunner: E2eTestRunner.None,
            appName: 'empty-app',
        } as yargs.Arguments<CreateStacksArguments>);
        await runGenerators(generators, 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(1);
        expect(execAsync).toHaveBeenCalledWith(
            'npx nx g @ensono-stacks/workspace:init --no-interactive',
            'folder/path',
        );
    });

    it('runs generators correctly with playwright test runner', async () => {
        const generators = getGeneratorsToRun({
            e2eTestRunner: E2eTestRunner.Playwright,
            appName: 'playwright-app',
        } as yargs.Arguments<CreateStacksArguments>);
        await runGenerators(generators, 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(2);
        expect(execAsync).toHaveBeenNthCalledWith(
            1,
            'npx nx g @ensono-stacks/workspace:init --no-interactive',
            'folder/path',
        );
        expect(execAsync).toHaveBeenNthCalledWith(
            2,
            'npx nx g @ensono-stacks/playwright:init --project=playwright-app --directory=apps/playwright-app-e2e --no-interactive',
            'folder/path',
        );
    });

    it('runs generators for next.js', async () => {
        const generators = getGeneratorsToRun({
            preset: 'next',
            appName: 'next-app',
            e2eTestRunner: E2eTestRunner.None,
        } as yargs.Arguments<CreateStacksArguments>);
        await runGenerators(generators, 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(3);
        expect(execAsync).toHaveBeenNthCalledWith(
            1,
            'npx nx g @ensono-stacks/workspace:init --no-interactive',
            'folder/path',
        );
        expect(execAsync).toHaveBeenNthCalledWith(
            2,
            'npx nx g @nx/next:app next-app --directory=apps/next-app --e2eTestRunner=none --no-interactive',
            'folder/path',
        );
        expect(execAsync).toHaveBeenNthCalledWith(
            3,
            'npx nx g @ensono-stacks/next:init --project=next-app --no-interactive',
            'folder/path',
        );
    });

    it('skips running generators if there are no generators defined', async () => {
        await runGenerators([], 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(0);
    });

    it('runs generators with preferred package manager', async () => {
        (getCommandVersion as jest.Mock).mockImplementation(() => '7.0.0');
        (detectPackageManager as jest.Mock).mockImplementation(() => 'pnpm');
        await runGenerators(['@ensono-stacks/workspace:init'], 'folder/path');

        expect(execAsync).toHaveBeenCalledTimes(1);
        expect(execAsync).toHaveBeenCalledWith(
            'pnpm exec nx g @ensono-stacks/workspace:init --no-interactive',
            'folder/path',
        );
    });

    it('replaces the Next preset with Apps', () => {
        const unparsedArguments: yargs.Arguments<
            Partial<CreateStacksArguments>
        > = {
            $0: '',
            _: [],
            preset: 'next',
            appName: 'test-app',
        };
        expect(normaliseForwardedArgv(unparsedArguments)).toMatchObject({
            $0: '',
            _: [],
            appName: 'test-app',
            preset: 'ts',
        });
    });
    it('does not replace a preset other than Next', () => {
        const unparsedArguments: yargs.Arguments<
            Partial<CreateStacksArguments>
        > = {
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
        const unparsedArguments: yargs.Arguments<
            Partial<CreateStacksArguments>
        > = {
            $0: '',
            _: [],
            appName: 'next',
        };
        expect(normaliseForwardedArgv(unparsedArguments)).toMatchObject({
            _: [],
            appName: 'next',
        });
    });
});
