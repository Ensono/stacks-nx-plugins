import chalk from 'chalk';
import semver from 'semver';

import { NX_VERSION } from './versions';

export async function checkNxVersion(nxVersion: string) {
    const setNxVersion = nxVersion === 'latest' ? NX_VERSION : nxVersion;
    const nxVersionScope = '^15.2.4';
    const matchVersion = semver.satisfies(setNxVersion, nxVersionScope);

    if (!matchVersion) {
        console.error(
            chalk.red`Failed to create nx workspace. Please use Nx version: ${nxVersionScope}`,
        );
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
    }

    return setNxVersion;
}
