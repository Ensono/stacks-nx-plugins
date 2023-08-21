import { readJsonFile } from '@nx/devkit';

// eslint-disable-next-line unicorn/import-style
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function getLatestNxVersion(): Promise<string> {
    const { stdout, stderr } = await exec('npm view nx version');
    return stderr || stdout;
}

export async function getNxVersion(): Promise<string> {
    let latestVersion;
    if (process.env.TEST_LATEST_NX) {
        latestVersion = await getLatestNxVersion();
        latestVersion = latestVersion.trim();
    }
    return (
        latestVersion ||
        process.env['NX_VERSION'] ||
        readJsonFile(`${process.cwd()}/package.json`).devDependencies[
            '@nx/workspace'
        ] ||
        'latest'
    );
}
