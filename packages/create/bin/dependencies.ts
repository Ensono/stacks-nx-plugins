import chalk from 'chalk';
import yargs from 'yargs';
import unparse from 'yargs-unparser';

import { execAsync } from './exec';
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
            `@nrwl/next:app ${argv.appName} --e2eTestRunner=none`,
            `@ensono-stacks/next:init --project=${argv.appName}`,
        );
    }

    if (argv.e2eTestRunner === E2eTestRunner.Playwright) {
        generators.push(
            `@ensono-stacks/playwright:init --project=${argv.appName}`,
        );

        console.log('\n');
        console.log(
            chalk.yellow`For accessibility support, you can run nx g @ensono-stacks/playwright:accessibility --project ${argv.appName}`,
        );
        console.log('\n');
        console.log(
            chalk.yellow`For visual regression support, you can run nx g @ensono-stacks/playwright:visualRegression --project ${argv.appName}`,
        );
    }

    return generators;
}

export function getStacksPlugins(argv: yargs.Arguments<CreateStacksArguments>) {
    const plugins = [...stacksRequiredPlugins];

    if (argv.preset === Preset.NextJs) {
        plugins.push('@nrwl/next', '@ensono-stacks/next');
    }

    if (argv.e2eTestRunner === E2eTestRunner.Playwright) {
        plugins.push('@ensono-stacks/playwright');
    }

    return plugins;
}

export async function installPackages(
    packages: string[],
    cwd: string,
    useDevelopment?: boolean,
) {
    if (packages.length === 0) {
        return Promise.resolve();
    }

    const versionedPackages = useDevelopment
        ? packages.map(packageName => `${packageName}@dev`)
        : packages;

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);

    return execAsync(`${pm.addDependency} ${versionedPackages.join(' ')}`, cwd);
}

export async function runGenerators(commands: string[], cwd: string) {
    if (commands.length === 0) {
        return Promise.resolve();
    }

    const packageManager = detectPackageManager(cwd);
    const pm = getPackageManagerCommand(packageManager);

    const promises = commands.map(command => () => {
        return execAsync(`${pm.exec} nx g ${command}`, cwd);
    });

    return chain(promises);
}

export async function commitGeneratedFiles(cwd: string, message: string) {
    process.env['HUSKY'] = '0';
    await execAsync(`cd ${cwd}`, cwd);
    await execAsync('git add .', cwd);
    await execAsync(`git commit -m "${message}"`, cwd);
}
