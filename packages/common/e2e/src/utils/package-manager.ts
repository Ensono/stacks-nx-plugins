import { getPackageManagerCommand, getProjects, logger } from '@nx/devkit';
import { runCommandAsync } from '@nx/plugin/testing';

import { SupportedPackageManager } from './types';
import { getNxVersion } from './versions';

export function getPackageManagerNxCreateCommand(
    packageManager: SupportedPackageManager,
): string {
    switch (packageManager) {
        case 'npm': {
            return `npx --yes @ensono-stacks/create-stacks-workspace`;
        }
        case 'yarn': {
            return `yarn global add @ensono-stacks/create-stacks-workspace`;
        }
        case 'pnpm': {
            return `pnpm dlx @ensono-stacks/create-stacks-workspace`;
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

    const pm = getPackageManagerCommand(packageManager);

    const { stdout, stderr } = await runCommandAsync(
        `${pm.addDev} ${packages.join(' ')}`,
    );

    if (stderr) {
        logger.log(stdout);
        logger.error(stderr);
    }
}

// export function installVersionedPackages(
//     packageManager: SupportedPackageManager,
//     packages: string[],
// ) {
//     const packagesWithVersions = packages.map(dependency => {
//         const match = dependency.match(/^(?:[a-z]|@).*@(.*)/);
//         return match ? dependency : `${dependency}@latest`;
//     });

//     return installPackages(packageManager, packagesWithVersions);
// }

export function installNxPackages(
    packageManager: SupportedPackageManager,
    packages: string[],
) {
    const nxVersion = getNxVersion();
    const nxPackages = packages
        .filter(
            dependency =>
                dependency.startsWith('@nrwl/') ||
                dependency.startsWith('@nx/'),
        )
        .map(dependency => {
            const match = dependency.match(/^(?:[a-z]|@).*@(.*)/);
            return match
                ? dependency.replace(match[1], nxVersion)
                : `${dependency}@${nxVersion}`;
        });

    return installPackages(packageManager, nxPackages);
}
