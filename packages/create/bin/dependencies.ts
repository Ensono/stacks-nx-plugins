import { execAsync } from '@ensono-stacks/core';
import chalk from 'chalk';
import yargs from 'yargs';

import {
    detectPackageManager,
    getPackageManagerCommand,
} from './package-manager';
// eslint-disable-next-line unicorn/prevent-abbreviations
import { CreateStacksArguments, E2eTestRunner, Preset } from './types';

const stacksRequiredPlugins = ['@ensono-stacks/workspace'];

/**
 * When `--preset=next` is passed into the CLI, we want to use the `apps` preset under the hood so that we can customise certain aspects.
 *
 * Replaces the `next` preset with `apps` if it exists and returns the new object containing flags.
 * @param forwardArgv Arguments of flags in the form {$0: string, _: string[], [argName: string]: any}: yargs.Arguments
 */
export function normaliseForwardedArgv(
    forwardArgv: yargs.Arguments<Partial<CreateStacksArguments>>,
) {
    const updatedForwardArgv = forwardArgv;
    updatedForwardArgv['preset'] =
        forwardArgv['preset'] === 'next' ? 'ts' : forwardArgv['preset'];

    // TODO: Remove this once determined if our playwright project could just enhance what already comes out the box
    updatedForwardArgv['e2eTestRunner'] =
        updatedForwardArgv['e2eTestRunner'] === 'playwright'
            ? 'none'
            : updatedForwardArgv['e2eTestRunner'];
    return updatedForwardArgv;
}

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

    // Run workspace init generator
    generators.push(`@ensono-stacks/workspace:init`);

    if (argv.preset === Preset.NextJs) {
        generators.push(
            `@nx/next:app ${argv.appName} --directory=apps/${argv.appName} --e2eTestRunner=none`,
            `@ensono-stacks/next:init --project=${argv.appName}`,
        );
    }

    if (argv.e2eTestRunner && argv.e2eTestRunner !== E2eTestRunner.None) {
        if (argv.e2eTestRunner === E2eTestRunner.Playwright) {
            console.log(
                chalk.yellow`\nFor visual regression support, you can run nx g @ensono-stacks/${argv.e2eTestRunner}:visualRegression --project ${argv.appName}`,
            );
        }
        console.log(
            chalk.yellow`\nFor accessibility support, you can run nx g @ensono-stacks/${argv.e2eTestRunner}:accessibility --project ${argv.appName}`,
        );
        generators.push(
            `@ensono-stacks/${argv.e2eTestRunner}:init --project=${argv.appName} --directory=apps/${argv.appName}-e2e`,
        );
    }

    return generators;
}

export function getStacksPlugins(argv: yargs.Arguments<CreateStacksArguments>) {
    const plugins = [...stacksRequiredPlugins];

    if (argv.preset === Preset.NextJs) {
        plugins.push('@nx/next', '@ensono-stacks/next');
    }

    if (argv.e2eTestRunner && argv.e2eTestRunner !== E2eTestRunner.None) {
        plugins.push(`@ensono-stacks/${argv.e2eTestRunner}`);
    }

    return plugins;
}

export async function installPackages(
    packages: string[],
    cwd: string,
    stacksVersion = 'latest',
): Promise<unknown> {
    if (packages.length === 0) {
        return 'No packages to install';
    }

    const versionedPackages = packages.map(packageName =>
        packageName.includes('@ensono-stacks')
            ? `${packageName}@${stacksVersion}`
            : packageName,
    );

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);
    return execAsync(`${pm.addDependency} ${versionedPackages.join(' ')}`, cwd);
}

export async function runGenerators(
    commands: string[],
    cwd: string,
): Promise<unknown> {
    if (commands.length === 0) {
        return;
    }

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);

    const promises = commands.map(command => () => {
        return execAsync(`${pm.exec} nx g ${command} --no-interactive`, cwd);
    });

    return chain(promises);
}
