import { getCommandVersion } from '@ensono-stacks/core';
import { existsSync } from 'fs';
import path from 'path';

export const packageManagerList = ['pnpm', 'yarn', 'npm'] as const;

export type PackageManager = (typeof packageManagerList)[number];

export function detectPackageManager(directory = ''): PackageManager {
    return existsSync(path.join(directory, 'yarn.lock'))
        ? 'yarn'
        : existsSync(path.join(directory, 'pnpm-lock.yaml'))
        ? 'pnpm'
        : 'npm';
}

export function getPackageManagerCommand(
    packageManager: PackageManager = detectPackageManager(),
): {
    addDependency: string;
    exec: string;
} {
    const [pmMajor, pmMinor] = getCommandVersion(packageManager).split('.');

    switch (packageManager) {
        case 'yarn': {
            return {
                addDependency: `yarn add -D`,
                exec: 'yarn',
            };
        }

        case 'pnpm': {
            let useExec = false;
            if ((+pmMajor >= 6 && +pmMinor >= 13) || +pmMajor >= 7) {
                useExec = true;
            }
            return {
                addDependency: 'pnpm add -D',
                exec: useExec ? 'pnpm exec' : 'pnpx',
            };
        }

        default: {
            process.env['npm_config_legacy_peer_deps'] =
                process.env['npm_config_legacy_peer_deps'] ?? 'true';
            return {
                addDependency: 'npm install -D',
                exec: 'npx',
            };
        }
    }
}
