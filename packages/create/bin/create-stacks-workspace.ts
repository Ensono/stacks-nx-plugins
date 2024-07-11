#!/usr/bin/env node
import { checkNxVersion } from '@ensono-stacks/core';
import chalk from 'chalk';
import { paramCase } from 'change-case';
import { spawnSync } from 'child_process';
import enquirer from 'enquirer';
import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';
import yargs from 'yargs';
import unparse from 'yargs-unparser';

import {
    commitGeneratedFiles,
    getGeneratorsToRun,
    getStacksPlugins,
    installPackages,
    runGenerators,
    normaliseForwardedArgv,
} from './dependencies';
import { configureNx } from './nx';
import { packageManagerList } from './package-manager';
// eslint-disable-next-line unicorn/prevent-abbreviations
import { CreateStacksArguments, E2eTestRunner, Preset } from './types';
import packageJson from '../package.json';

const stacksVersion = packageJson.version;
const presetOptions: { name: Preset; message: string }[] = [
    {
        name: Preset.Apps,
        message:
            'apps              [an empty monorepo with no plugins with a layout that works best for building apps]',
    },
    {
        name: Preset.NextJs,
        message:
            'next.js           [a monorepo with a single Next.js application]',
    },
];

// eslint-disable-next-line unicorn/prevent-abbreviations
const e2eTestRunnerOptions: { name: E2eTestRunner; message: string }[] = [
    {
        name: E2eTestRunner.None,
        message: 'none',
    },
    {
        name: E2eTestRunner.Playwright,
        message: 'playwright',
    },
    {
        name: E2eTestRunner.Cypress,
        message: 'cypress',
    },
];

export async function determineRepoName(
    parsedArgv: yargs.Arguments<CreateStacksArguments>,
): Promise<string> {
    const repoName = parsedArgv._[0]
        ? parsedArgv._[0].toString()
        : (parsedArgv['name'] as string | undefined);

    if (repoName) {
        return repoName;
    }

    return enquirer
        .prompt<{ RepoName: string }>([
            {
                name: 'RepoName',
                message: `Repository name                      `,
                type: 'input',
            },
        ])
        .then(value => {
            if (!value.RepoName) {
                console.error(chalk.red`Invalid repository name`);
                process.exit(1);
            }
            return value.RepoName;
        });
}

export async function determinePreset(
    parsedArguments: yargs.Arguments<CreateStacksArguments>,
): Promise<Preset> {
    if (!(parsedArguments.preset || parsedArguments.interactive)) {
        return Preset.Apps;
    }

    if (parsedArguments.preset) {
        if (
            (Object.values(Preset) as string[]).includes(parsedArguments.preset)
        ) {
            return parsedArguments.preset as Preset;
        }
        console.error(
            chalk.red`Invalid preset: It must be one of the following: ${Object.values(
                Preset,
            )}`,
        );

        process.exit(1);
    }

    return enquirer
        .prompt<{ Preset: Preset }>([
            {
                name: 'Preset',
                message: `What to create in the new workspace  `,
                initial: 0,
                type: 'autocomplete',
                choices: presetOptions,
            },
        ])
        .then(a => a.Preset);
}

export async function determineAppName(
    preset: Preset,
    parsedArguments: yargs.Arguments<CreateStacksArguments>,
): Promise<string> {
    if (preset === Preset.Apps) {
        return '';
    }

    if (parsedArguments.appName) {
        return parsedArguments.appName;
    }

    if (!parsedArguments.interactive) {
        return `stacks-app`;
    }

    return enquirer
        .prompt<{ AppName: string }>([
            {
                name: 'AppName',
                message: `Application name                     `,
                type: 'input',
            },
        ])
        .then(a => {
            if (!a.AppName) {
                console.error(chalk.red`Invalid name: Cannot be empty`);
                process.exit(1);
            }
            return a.AppName;
        });
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export async function determineE2eTestRunner(
    parsedArguments: yargs.Arguments<CreateStacksArguments>,
) {
    if (!(parsedArguments.e2eTestRunner || parsedArguments.interactive)) {
        return E2eTestRunner.None;
    }

    if (parsedArguments.e2eTestRunner) {
        if (
            (Object.values(E2eTestRunner) as string[]).includes(
                parsedArguments.e2eTestRunner,
            )
        ) {
            return parsedArguments.e2eTestRunner as E2eTestRunner;
        }

        console.error(
            chalk.red`Invalid test runner: It must be one of the following:${Object.values(
                E2eTestRunner,
            )}`,
        );

        process.exit(1);
    }

    return enquirer
        .prompt<{ E2eTestRunner: E2eTestRunner }>([
            {
                name: 'E2eTestRunner',
                message: `What test runner to include  `,
                initial: 0,
                type: 'autocomplete',
                choices: e2eTestRunnerOptions,
            },
        ])
        .then(a => {
            return a.E2eTestRunner;
        });
}

export async function getConfiguration(
    argv: yargs.Arguments<CreateStacksArguments>,
): Promise<void> {
    try {
        const name = await determineRepoName(argv);
        let { preset, appName, e2eTestRunner } = argv;

        preset = await determinePreset(argv);

        appName = await determineAppName(preset as Preset, argv);

        if (preset === Preset.NextJs) {
            e2eTestRunner = await determineE2eTestRunner(argv);
        }

        Object.assign(argv, {
            name: paramCase(name),
            preset,
            appName: paramCase(appName),
            e2eTestRunner,
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

async function main(parsedArgv: yargs.Arguments<CreateStacksArguments>) {
    const { nxVersion, dir, overwrite, ...forwardArgv } = parsedArgv;
    const { name, skipGit } = forwardArgv;

    const argumentsToForward = unparse(
        normaliseForwardedArgv(forwardArgv) as unparse.Arguments,
        { alias: { packageManager: ['pm'], interactive: ['i'] } },
    );

    const workingDirectory = path.resolve(dir);
    const targetDirectory = path.join(workingDirectory, name);
    const currentDirectoryIsTarget = targetDirectory === process.cwd();

    if (currentDirectoryIsTarget) {
        process.chdir(workingDirectory);
    }

    if (fs.existsSync(targetDirectory)) {
        if (overwrite) {
            rimrafSync(targetDirectory);
        } else {
            console.error(
                chalk.red`Target directory ${targetDirectory} already exists! use --overwrite to force using this folder.`,
            );
            process.exit(1);
        }
    } else if (!fs.existsSync(workingDirectory)) {
        console.error(
            chalk.red`Working directory ${workingDirectory} does not exist!`,
        );
        process.exit(1);
    }

    const setNxVersion = checkNxVersion(nxVersion);

    console.log(chalk.magenta`Running Nx create-nx-workspace@${setNxVersion}`);

    const nxResult = spawnSync(
        'npx',
        [
            `create-nx-workspace@${setNxVersion}`,
            '--yes',
            '--no-interactive',
            ...argumentsToForward,
        ],
        {
            env: process.env,
            shell: true,
            cwd: workingDirectory,
            stdio: 'inherit',
        },
    );

    if (nxResult.status !== 0) {
        console.error(
            chalk.red`Failed to create nx workspace. See error above.`,
        );
        process.exit(1);
    }

    process.chdir(targetDirectory);

    const packagesToInstall = getStacksPlugins(parsedArgv);

    // Set nx version for nx packages
    const versionedPackagesToInstall = packagesToInstall.map(p =>
        p.startsWith('@nx') ? `${p}@${setNxVersion}` : p,
    );

    console.log(chalk.magenta`Installing Stacks dependencies`);
    await installPackages(
        versionedPackagesToInstall,
        targetDirectory,
        parsedArgv.useDev,
    );
    console.log(
        chalk.magenta`Successfully installed: ${versionedPackagesToInstall.join(
            '\n',
        )}`,
    );

    console.log(chalk.magenta`Configuring Stacks with Nx ${setNxVersion}`);
    configureNx(parsedArgv, targetDirectory);
    const generatorsToRun = getGeneratorsToRun(parsedArgv);
    console.log(
        chalk.cyan`Running the following generators:\n${generatorsToRun.join(
            '\n',
        )}`,
    );
    try {
        await runGenerators(generatorsToRun, targetDirectory);
    } catch (error: any) {
        console.error(chalk.red`Failed to run Stacks generators.`);
        console.error(error.message);
        process.exit(1);
    }

    if (!skipGit) {
        await commitGeneratedFiles(targetDirectory, 'stacks init');
    }

    console.log(chalk.magenta`Stacks is ready`);
}

export function withOptions<T>(
    argv: yargs.Argv<T>,
    ...options: ((argv: yargs.Argv<T>) => yargs.Argv<T>)[]
): any {
    // Reversing the options keeps the execution order correct.
    // e.g. [withCI, withGIT] should transform into withGIT(withCI) so withCI resolves first.
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return options.reverse().reduce((argv, option) => option(argv), argv);
}

export const commandsObject: yargs.Argv<CreateStacksArguments> = yargs
    .wrap(yargs.terminalWidth())
    .parserConfiguration({ 'strip-dashed': true, 'dot-notation': true })
    .command<CreateStacksArguments>(
        '$0 [name] [options]',
        'Create a new Stacks Nx workspace',
        updatedYargs =>
            withOptions(
                updatedYargs
                    .option('name', {
                        describe: chalk.dim`Workspace name (e.g. org name)`,
                        type: 'string',
                    })
                    .option('preset', {
                        describe: chalk.dim`Customizes the initial content of your workspace. Default presets include: [${Object.values(
                            Preset,
                        )
                            .map(p => `"${p}"`)
                            .join(', ')}]`,
                        type: 'string',
                    })
                    .option('dir', {
                        describe: chalk.dim`The working directory to install from`,
                        type: 'string',
                        default: '.',
                    })
                    .option('appName', {
                        describe: chalk.dim`The name of the application when a preset with pregenerated app is selected`,
                        type: 'string',
                    })
                    .option('e2eTestRunner', {
                        describe: chalk.dim`The name of the e2e test runner library to install when selected`,
                        type: 'string',
                    })
                    .option('nxVersion', {
                        describe: chalk.dim`Set the version of Nx you want installed`,
                        type: 'string',
                        default: 'latest',
                    })
                    .option('packageManager', {
                        alias: 'pm',
                        describe: chalk.dim`Package manager to use`,
                        choices: [...packageManagerList].sort(),
                        defaultDescription: 'npm',
                        type: 'string',
                    })
                    .option('interactive', {
                        describe: chalk.dim`Enable interactive mode`,
                        alias: 'i',
                        type: 'boolean',
                        default: true,
                    })
                    .option('overwrite', {
                        describe: chalk.dim`Overwrite the target directory on install`,
                        alias: 'o',
                        type: 'boolean',
                        default: false,
                    })
                    .option('skipGit', {
                        describe: chalk.dim`Skip git init`,
                        type: 'boolean',
                        default: false,
                    })
                    .option('cloud.platform', {
                        describe: chalk.dim`Name of the cloud provider`,
                        choices: ['azure'],
                        type: 'string',
                        default: 'azure',
                    })
                    .option('vcs.type', {
                        describe: chalk.dim`Version control provider`,
                        choices: ['azdo', 'github'],
                        type: 'string',
                    })
                    .option('vcs.url', {
                        describe: chalk.dim`Version control remote url`,
                        type: 'string',
                    })
                    .option('nxCloud', {
                        describe: chalk.dim`Enable Nx Cloud`,
                        type: 'string',
                        choices: ['skip', 'github', 'circleci', 'yes'],
                        default: 'skip',
                    }),
            ),
        async (argv: yargs.ArgumentsCamelCase<CreateStacksArguments>) => {
            return main(argv).catch(console.log);
        },
        [getConfiguration as yargs.MiddlewareFunction],
    )
    .help('help', chalk.dim`Show help`)
    .version(
        'version',
        chalk.dim`Show version`,
        stacksVersion,
    ) as yargs.Argv<CreateStacksArguments>;
