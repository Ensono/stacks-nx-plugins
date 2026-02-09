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
    name: string;
    addDependency: string;
    exec: string;
    download: string;
} {
    switch (packageManager) {
        case 'yarn': {
            return {
                name: 'yarn',
                addDependency: `yarn add -D`,
                exec: 'yarn',
                download: 'yarn dlx',
            };
        }

        case 'pnpm': {
            return {
                name: 'pnpm',
                addDependency: 'pnpm add -D',
                exec: 'pnpm exec',
                download: 'pnpx',
            };
        }

        default: {
            process.env['npm_config_legacy_peer_deps'] =
                process.env['npm_config_legacy_peer_deps'] ?? 'true';

            return {
                name: 'npm',
                addDependency: 'npm install -D',
                exec: 'npx',
                download: 'npx --yes',
            };
        }
    }
}
