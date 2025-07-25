import { execSync } from 'child_process';

import chalk from 'chalk';
import * as semver from 'semver';

import { NX_VERSION_SCOPE } from './versions';

const getLatestNxVersion = () => {
    return execSync(`npm show nx version`).toString().trim();
};

export function checkNxVersion(nxVersion: string) {
    const setNxVersion =
        nxVersion === 'latest' ? getLatestNxVersion() : nxVersion;

    const matchVersion = semver.satisfies(setNxVersion, NX_VERSION_SCOPE);

    if (!matchVersion) {
        console.error(
            chalk.red`Failed to create nx workspace. Please use Nx version: ${NX_VERSION_SCOPE}`,
        );
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
    }

    return setNxVersion;
}
