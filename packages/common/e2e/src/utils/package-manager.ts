import { getPackageManagerCommand, logger } from '@nx/devkit';
import { runCommandAsync } from '@nx/plugin/testing';

import { SupportedPackageManager } from './types';
import { getNxVersion } from './versions';

export async function getPackageManagerNxCreateCommand(
    packageManager: SupportedPackageManager,
    version = 'latest',
): Promise<string> {
    const nxVersion = await getNxVersion();
    switch (packageManager) {
        case 'yarn':
        case 'npm': {
            return `npx --yes @ensono-stacks/create-stacks-workspace@${version} --nxVersion=${nxVersion}`;
        }
        case 'pnpm': {
            return `pnpm dlx @ensono-stacks/create-stacks-workspace@${version} --nxVersion=${nxVersion}`;
        }
        default: {
            throw new Error(
                `Unsupported package manager used: ${packageManager}`,
            );
        }
    }
}

export function getSelectedPackageManager(): SupportedPackageManager {
    return (process.env['SELECTED_PM'] as SupportedPackageManager) || 'npm';
}

export async function installPackages(
    packageManager: SupportedPackageManager,
    packages: string[],
) {
    if (packages.length === 0) {
        return;
    }
    logger.log(`Installing the following packages:${packages.join('\n')}`);
    const pm = getPackageManagerCommand(packageManager);

    const { stdout, stderr } = await runCommandAsync(
        `${pm.addDev} ${packages.join(' ')}`,
    );

    if (stderr) {
        logger.log(stdout);
        logger.error(stderr);
    }
}

export function installVersionedPackages(
    packageManager: SupportedPackageManager,
    stacksPackagesToInstall: string[],
) {
    if (stacksPackagesToInstall) {
        const stacksPackages = stacksPackagesToInstall.map(stacksPackage => {
            const match = stacksPackage.match(/^(?:[a-z]|@).*@(.*)/);
            return match ? stacksPackage : `${stacksPackage}@latest`;
        });
        return installPackages(packageManager, stacksPackages);
    }
    return 'No pacakges to install';
}

export async function installNxPackages(
    packageManager: SupportedPackageManager,
    packages: string[],
) {
    const nxVersion = await getNxVersion();
    const invalidPackages = packages.filter(dependency =>
        dependency.startsWith('@nrwl/'),
    );
    if (invalidPackages.length > 0) {
        throw new Error(
            `Following @nrwl packages are not supported, upgrade to @nx: ${invalidPackages.join(
                '\n',
            )}`,
        );
    }
    const nxPackages = packages
        .filter(dependency => dependency.startsWith('@nx/'))
        .map(dependency => {
            const match = dependency.match(/^(?:[a-z]|@).*@(.*)/);
            return match
                ? dependency.replace(match[1], nxVersion)
                : `${dependency}@${nxVersion}`;
        });

    return installPackages(packageManager, nxPackages);
}
