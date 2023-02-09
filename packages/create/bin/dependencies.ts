import yargs from 'yargs';
import unparse from 'yargs-unparser';

import { execAsync } from './exec';
import {
    detectPackageManager,
    getPackageManagerCommand,
} from './package-manager';
import { CreateStacksArguments, Preset } from './types';

const stacksRequiredPlugins = ['@ensono-stacks/workspace'];

/**
 * When `--preset=next` is passed into the CLI, we want to use the `apps` preset under the hood so that we can customise certain aspects.
 *
 * Replaces the `next` preset with `apps` if it exists and returns the new object containing flags.
 * @param forwardArgv Arguments of flags in the form {_: string[], [argName: string]: any}: yargs-unparser.Arguments
 */
export function normaliseForwardedArgv(forwardArgv: unparse.Arguments) {
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

export function getGeneratorsToRun(
    argv: yargs.Arguments<CreateStacksArguments>,
) {
    const generators: string[] = [];
    generators.push(`@ensono-stacks/workspace:init`);

    if (argv.preset === Preset.NextJs) {
        generators.push(
            `@nrwl/next:app ${argv.appName} --e2eTestRunner=none`,
            `@ensono-stacks/next:init --project=${argv.appName}`,
        );
    }

    return generators;
}

export function getStacksPlugins(argv: yargs.Arguments<CreateStacksArguments>) {
    const plugins = [...stacksRequiredPlugins];

    if (argv.preset === Preset.NextJs) {
        plugins.push('@nrwl/next', '@ensono-stacks/next');
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

    const promises = commands.map(command => () => {
        return execAsync(`${pm.exec} nx g ${command}`, cwd);
    });

    return chain(promises);
}

export async function commitGeneratedFiles(cwd: string, message: string) {
    await execAsync(`cd ${cwd}`, cwd);
    await execAsync('git add .', cwd);
    await execAsync(`HUSKY=0 git commit -m "${message}"`, cwd);
}
