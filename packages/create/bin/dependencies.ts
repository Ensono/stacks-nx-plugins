import chalk from 'chalk';
import yargs from 'yargs';

import { execAsync } from './exec';
import {
    detectPackageManager,
    getPackageManagerCommand,
} from './package-manager';
import { CreateStacksArguments, Preset } from './types';

const stacksRequiredPlugins = ['@ensono-stacks/workspace'];

async function chain([promise, ...promises]: (() => Promise<unknown>)[]) {
    if (promise) {
        await promise();
        await chain(promises);
    }
}

function checkRequiredArguments(
    argv: yargs.Arguments<CreateStacksArguments>,
    required: (keyof CreateStacksArguments)[],
): boolean {
    return required.every(key => Boolean(argv[key]));
}

export function getGeneratorsToRun(
    argv: yargs.Arguments<CreateStacksArguments>,
) {
    const generators: string[] = [];

    let pipelineRunnerOption = '';
    if (
        !checkRequiredArguments(argv, [
            'business',
            'domain',
            'cloud',
            'pipeline',
        ])
    ) {
        pipelineRunnerOption = ' --pipelineRunner=none';
        console.log(
            chalk.yellow`Setting --pipelineRunner=none because Stacks config is missing. Did you start using stacks-cli?`,
        );
    }

    generators.push(`@ensono-stacks/workspace:init${pipelineRunnerOption}`);

    if (argv.preset === Preset.NextJs) {
        generators.push(`@ensono-stacks/next:init --project=${argv.appName}`);
    }

    return generators;
}

export function getStacksPlugins(argv: yargs.Arguments<CreateStacksArguments>) {
    const plugins = [...stacksRequiredPlugins];

    if (argv.preset === Preset.NextJs) {
        plugins.push('@ensono-stacks/next');
    }

    return plugins;
}

export async function installPackages(packages: string[], cwd: string) {
    if (packages.length === 0) {
        return Promise.resolve();
    }

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);

    return execAsync(`${pm.addDependency} ${packages.join(' ')}`, cwd);
}

export async function runGenerators(commands: string[], cwd: string) {
    if (commands.length === 0) {
        return Promise.resolve();
    }

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);

    const promises = commands.map(
        command => () => execAsync(`${pm.exec} nx g ${command}`, cwd),
    );

    return chain(promises);
}

export async function commitGeneratedFiles(cwd: string, message: string) {
    process.env['HUSKY'] = '0';
    await execAsync(`cd ${cwd}`, cwd);
    await execAsync('git add .', cwd);
    await execAsync(`git commit -m "${message}"`, cwd);
}
