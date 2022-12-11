#!/usr/bin/env node
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import enquirer from 'enquirer';
import path from 'path';
import yargs from 'yargs';
import unparse from 'yargs-unparser';

import {
    getGeneratorsToRun,
    getStacksPlugins,
    installPackages,
    runGenerators,
} from './dependencies';
import { packageManagerList, PackageManager } from './package-manager';

async function determineRepoName(parsedArgv: yargs.Arguments): Promise<string> {
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

async function getConfiguration(argv: yargs.Arguments) {
    const name = await determineRepoName(argv);

    Object.assign(argv, {
        name,
    });
}

async function main(parsedArgv: yargs.Arguments<CreateStacksArguments>) {
    const { nxVersion, ...forwardArgv } = parsedArgv;
    console.log(parsedArgv);
    const argumentsToForward = unparse(forwardArgv as unparse.Arguments);

    console.log(chalk.magenta`Running Nx create-nx-workspace@${nxVersion}`);
    spawnSync(
        'npx',
        [`create-nx-workspace@${nxVersion}`, ...argumentsToForward],
        {
            env: process.env,
            shell: true,
            cwd: process.cwd(),
            stdio: [process.stdin, process.stdout, process.stderr],
        },
    );

    const packagesToInstall = getStacksPlugins(parsedArgv);

    const cwd = path.join(process.cwd(), forwardArgv.name);

    console.log(chalk.magenta`Installing Stacks dependencies`);
    await installPackages(packagesToInstall, cwd);
    console.log(
        chalk.magenta`Successfully installed: ${packagesToInstall.join(' ')}`,
    );

    const generatorsToRun = getGeneratorsToRun(parsedArgv);

    console.log(chalk.magenta`Configuring Stacks`);
    await runGenerators(generatorsToRun, cwd);
    console.log(chalk.magenta`Stacks is ready`);
}

interface CreateStacksArguments {
    name: string;
    preset: string;
    nxVersion: string;
    packageManager: PackageManager;
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
                }),
        async (argv: yargs.ArgumentsCamelCase<CreateStacksArguments>) => {
            return main(argv).catch(console.log);
        },
        [getConfiguration],
    );
