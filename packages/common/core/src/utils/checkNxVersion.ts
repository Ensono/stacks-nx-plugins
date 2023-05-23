import chalk from 'chalk';
import semver from 'semver';

import { NX_VERSION } from './versions';

export async function checkNxVersion(nxVersion: string) {
    const setNxVersion = nxVersion === 'latest' ? NX_VERSION : nxVersion;

    const matchVersion = semver.satisfies(setNxVersion, NX_VERSION);

    if (!matchVersion) {
        console.error(
            chalk.red`Failed to create nx workspace. Please use Nx version: ${NX_VERSION}`,
        );
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
    }

    return setNxVersion;
}
