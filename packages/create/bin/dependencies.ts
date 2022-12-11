import yargs from 'yargs';

import { execAsync } from './exec';
import {
    detectPackageManager,
    getPackageManagerCommand,
} from './package-manager';

const stacksRequiredPlugins = [
    '@ensono-stacks/workspace',
    '@ensono-stacks/rest-client',
];

export function getGeneratorsToRun(argv: yargs.Arguments) {
    const generators: string[] = [];
    generators.push(`@ensono-stacks/workspace:install`);
    return generators;
}

export function getStacksPlugins(argv: yargs.Arguments) {
    return stacksRequiredPlugins;
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

    const promises = commands.map(command =>
        execAsync(`${pm.exec} nx g ${command}`, cwd),
    );

    return Promise.allSettled(promises);
}
