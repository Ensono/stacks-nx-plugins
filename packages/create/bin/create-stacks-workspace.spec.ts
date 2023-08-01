import chalk from 'chalk';
import enquirer from 'enquirer';
import yargs from 'yargs';

import {
    determineAppName,
    // eslint-disable-next-line unicorn/prevent-abbreviations
    determineE2eTestRunner,
    determinePreset,
    determineRepoName,
    getConfiguration,
} from './create-stacks-workspace';
import { CreateStacksArguments, Preset } from './types';

const mockExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as never);

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('determine preset', () => {
    it('valid preset', async () => {
        const result = await determinePreset({
            preset: 'next',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('next');
    });

    it('invalid preset', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            Preset: 'apps',
        });

        await determinePreset({
            preset: 'invalid',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(consoleErrorSpy).toBeCalledWith(
            chalk.red`Invalid preset: It must be one of the following: apps,ts,next`,
        );

        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('no preset', async () => {
        const result = await determinePreset({
            name: 'testpreset',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('apps');
    });

    it('interactive set with no preset', async () => {
        const result = await determinePreset({
            name: 'testpreset',
            interactive: false,
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('apps');
    });
});

describe('determine repo name', () => {
    it('valid repo name no position arg', async () => {
        const result = await determineRepoName({
            _: [],
            name: 'myrepo',
        } as unknown as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('myrepo');
    });

    it('positional arg repo name', async () => {
        const result = await determineRepoName({
            _: ['testpositional'],
            name: undefined,
        } as unknown as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('testpositional');
    });

    it('prompt for repo name', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            RepoName: 'testprompt',
        });

        const result = await determineRepoName({
            _: [],
            name: undefined,
        } as unknown as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('testprompt');
    });

    it('invalid repo name', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            RepoName: '',
        });

        await determineRepoName({
            _: [],
            name: undefined,
        } as unknown as yargs.Arguments<CreateStacksArguments>);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            chalk.red`Invalid repository name`,
        );
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});

describe('determine app-name', () => {
    it('with preset set to apps', async () => {
        const result = await determineAppName(Preset.Apps, {
            appName: 'myapp',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('');
    });

    it('with preset set to next', async () => {
        const result = await determineAppName(Preset.NextJs, {
            appName: 'myapp',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('myapp');
    });

    it('with no name and not interacive', async () => {
        const result = await determineAppName(Preset.NextJs, {
            interactive: false,
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('stacks-app');
    });

    it('prompt for name', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            AppName: 'myapp',
        });

        const result = await determineAppName(Preset.NextJs, {
            interactive: true,
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('myapp');
    });

    it('invalid name', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            AppName: '',
        });

        await determineAppName(Preset.NextJs, {
            interactive: true,
        } as yargs.Arguments<CreateStacksArguments>);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            chalk.red`Invalid name: Cannot be empty`,
        );
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});

describe('determine e2e test runner', () => {
    it('with valid test runner', async () => {
        const result = await determineE2eTestRunner({
            e2eTestRunner: 'cypress',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('cypress');
    });

    it('with no test runner', async () => {
        const result = await determineE2eTestRunner({
            e2eTestRunner: '',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('none');
    });

    it('with invalid test runner', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            E2eTestRunner: 'invalid',
        });

        await determineE2eTestRunner({
            e2eTestRunner: 'invalid',
        } as yargs.Arguments<CreateStacksArguments>);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            chalk.red`Invalid test runner: It must be one of the following:none,playwright,cypress`,
        );
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('prompt for test runner', async () => {
        jest.spyOn(enquirer, 'prompt').mockResolvedValueOnce({
            E2eTestRunner: 'mytestrunner',
        });

        const result = await determineE2eTestRunner({
            interactive: true,
        } as yargs.Arguments<CreateStacksArguments>);

        expect(result).toBe('mytestrunner');
    });
});

describe('get configuration', () => {
    it('with valid config', async () => {
        await getConfiguration({
            _: ['myrepo'],
            preset: 'apps',
            e2eTestRunner: 'cypress',
        } as yargs.Arguments<CreateStacksArguments>);
    });
});
