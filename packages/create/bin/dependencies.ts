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
        forwardArgv['preset'] === 'next' ? 'apps' : forwardArgv['preset'];
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

    // Conditionally run workspace init deployment generator
    if (
        checkRequiredArguments(argv, [
            'business',
            'domain',
            'cloud',
            'pipeline',
        ])
    ) {
        generators.push(`@ensono-stacks/workspace:init-deployment`);
    } else {
        console.log(
            chalk.yellow`Skipping @ensono-stacks/workspace:init-deployment generator because Stacks config is missing. Did you start using stacks-cli?`,
        );
    }

    if (argv.preset === Preset.NextJs) {
        generators.push(
            `@nx/next:app ${argv.appName} --e2eTestRunner=none --no-appDir`,
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
            `@ensono-stacks/${argv.e2eTestRunner}:init --project=${argv.appName}`,
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
    useDevelopment?: boolean,
): Promise<unknown> {
    if (packages.length === 0) {
        return 'No packages to install';
    }

    const versionedPackages = useDevelopment
        ? packages.map(packageName =>
              packageName.includes('@ensono-stacks')
                  ? `${packageName}@dev`
                  : packageName,
          )
        : packages;

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
        return execAsync(`${pm.exec} nx g ${command}`, cwd);
    });

    // eslint-disable-next-line consistent-return
    return chain(promises);
}

export async function commitGeneratedFiles(cwd: string, message: string) {
    process.env['HUSKY'] = '0';
    await execAsync(`cd ${cwd}`, cwd);
    await execAsync('git add .', cwd);
    await execAsync(`git commit -m "${message}"`, cwd);
}
