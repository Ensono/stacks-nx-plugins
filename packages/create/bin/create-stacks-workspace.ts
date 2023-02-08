#!/usr/bin/env node
import chalk from 'chalk';
import { paramCase } from 'change-case';
import { spawnSync } from 'child_process';
import enquirer from 'enquirer';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import unparse from 'yargs-unparser';

import packageJson from '../package.json';
import {
    commitGeneratedFiles,
    getGeneratorsToRun,
    getStacksPlugins,
    installPackages,
    runGenerators,
} from './dependencies';
import { configureNx } from './nx';
import { packageManagerList } from './package-manager';
import { CreateStacksArguments, Preset } from './types';

const stacksVersion = packageJson.version;
const presetOptions: { name: Preset; message: string }[] = [
    {
        name: Preset.Apps,
        message:
            'apps              [an empty monorepo with no plugins with a layout that works best for building apps]',
    },
    {
        name: Preset.ReactMonorepo,
        message:
            'react             [a monorepo with a single React application]',
    },
    {
        name: Preset.NextJs,
        message:
            'next.js           [a monorepo with a single Next.js application]',
    },
];

async function determineRepoName(
    parsedArgv: yargs.Arguments<CreateStacksArguments>,
): Promise<string> {
    const repoName = parsedArgv._[0]
        ? parsedArgv._[0].toString()
        : (parsedArgv['name'] as string | undefined);

    if (repoName) {
        return Promise.resolve(repoName);
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

async function determinePreset(
    parsedArguments: yargs.Arguments<CreateStacksArguments>,
): Promise<Preset> {
    if (!parsedArguments.preset && !parsedArguments.interactive) {
        return Promise.resolve(Preset.Apps);
    }

    if (parsedArguments.preset) {
        if (
            (Object.values(Preset) as string[]).includes(parsedArguments.preset)
        ) {
            console.error(chalk.red`Invalid preset: It must be one of the following:
${Object.values(Preset)}`);

            process.exit(1);
        } else {
            return Promise.resolve(parsedArguments.preset as Preset);
        }
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

async function determineAppName(
    preset: Preset,
    parsedArguments: yargs.Arguments<CreateStacksArguments>,
): Promise<string> {
    if (preset === Preset.Apps) {
        return Promise.resolve('');
    }

    if (parsedArguments.appName) {
        return Promise.resolve(parsedArguments.appName);
    }

    if (!parsedArguments.interactive) {
        return Promise.resolve(`stacks-app`);
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

async function getConfiguration(argv: yargs.Arguments<CreateStacksArguments>) {
    const name = await determineRepoName(argv);
    let { preset, appName } = argv;

    if (!preset) {
        preset = await determinePreset(argv);
    }

    if (preset && !appName) {
        appName = await determineAppName(preset as Preset, argv);
    }

    Object.assign(argv, {
        name: paramCase(name),
        preset,
        appName: paramCase(appName),
    });
}

async function main(parsedArgv: yargs.Arguments<CreateStacksArguments>) {
    const { nxVersion, dir, overwrite, ...forwardArgv } = parsedArgv;
    const { name } = forwardArgv;
    const argumentsToForward = unparse(forwardArgv as unparse.Arguments, {
        alias: {
            packageManager: ['pm'],
            interactive: ['i'],
        },
    });

    const root = path.resolve(dir);

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true });
    }

    process.chdir(root);

    const cwd = path.join(process.cwd(), name);

    if (fs.existsSync(cwd)) {
        if (overwrite) {
            fs.rmSync(cwd, { recursive: true, force: true });
        } else {
            console.error(chalk.red`Directory ${cwd} already exists!`);
            process.exit(1);
        }
    }

    console.log(chalk.magenta`Running Nx create-nx-workspace@${nxVersion}`);

    const nxResult = spawnSync(
        'npx',
        [
            `create-nx-workspace@${nxVersion}`,
            '--yes',
            '--no-interactive',
            ...argumentsToForward,
        ],
        {
            env: process.env,
            shell: true,
            cwd: process.cwd(),
            stdio: 'inherit',
        },
    );
    if (nxResult.status !== 0) {
        console.error(
            chalk.red`Failed to create nx workspace. See error above.`,
        );
        process.exit(1);
    }

    const packagesToInstall = getStacksPlugins(parsedArgv);

    console.log(chalk.magenta`Installing Stacks dependencies`);
    await installPackages(packagesToInstall, cwd);
    console.log(
        chalk.magenta`Successfully installed: ${packagesToInstall.join(' ')}`,
    );

    console.log(chalk.magenta`Configuring Stacks`);
    configureNx(parsedArgv, cwd);
    const generatorsToRun = getGeneratorsToRun(parsedArgv);

    try {
        await runGenerators(generatorsToRun, cwd);
    } catch (error: any) {
        console.error(chalk.red`Failed to run Stacks generators.`);
        console.error(error.message);
        process.exit(1);
    }

    await commitGeneratedFiles(cwd, 'stacks init');

    console.log(chalk.magenta`Stacks is ready`);
}

export const commandsObject: yargs.Argv<CreateStacksArguments> = yargs
    .wrap(yargs.terminalWidth())
    .parserConfiguration({ 'strip-dashed': true, 'dot-notation': true })
    .command(
        '$0 [name] [options]',
        'Create a new Stacks Nx workspace',
        parsedArgv =>
            parsedArgv
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
                    describe: chalk.dim`The directory to install to`,
                    type: 'string',
                    default: '.',
                })
                .option('appName', {
                    describe: chalk.dim`The name of the application when a preset with pregenerated app is selected`,
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
                .option('cloud.platform', {
                    describe: chalk.dim`Name of the cloud provider`,
                    choices: ['azure'],
                    type: 'string',
                    default: 'azure',
                })
                .option('cloud.region', {
                    describe: chalk.dim`Region name where resources should be created`,
                    type: 'string',
                    default: 'euw',
                })
                .option('pipeline', {
                    describe: chalk.dim`Name of the pipeline provider`,
                    choices: ['azdo'],
                    type: 'string',
                    default: 'azdo',
                })
                .option('business.company', {
                    describe: chalk.dim`Company Name`,
                    type: 'string',
                })
                .option('business.domain', {
                    describe: chalk.dim`Company Scope or area`,
                    type: 'string',
                })
                .option('business.component', {
                    describe: chalk.dim`Company component being worked on`,
                    type: 'string',
                })
                .option('domain.internal', {
                    describe: chalk.dim`Internal domain for nonprod resources`,
                    type: 'string',
                })
                .option('domain.external', {
                    describe: chalk.dim`External domain for prod resources`,
                    type: 'string',
                })
                .option('terraform.group', {
                    describe: chalk.dim`Terraform state group name`,
                    type: 'string',
                })
                .option('terraform.container', {
                    describe: chalk.dim`Terraform storage container name`,
                    type: 'string',
                })
                .option('terraform.storage', {
                    describe: chalk.dim`Terraform storage name`,
                    type: 'string',
                })
                .option('vcs.type', {
                    describe: chalk.dim`Version control provider`,
                    choices: ['azdo', 'github'],
                    type: 'string',
                })
                .option('vcs.url', {
                    describe: chalk.dim`Version control remote url`,
                    type: 'string',
                }),
        async (argv: yargs.ArgumentsCamelCase<CreateStacksArguments>) => {
            return main(argv).catch(console.log);
        },
        [getConfiguration as yargs.MiddlewareFunction],
    )
    .help('help', chalk.dim`Show help`)
    .version('version', chalk.dim`Show version`, stacksVersion);
