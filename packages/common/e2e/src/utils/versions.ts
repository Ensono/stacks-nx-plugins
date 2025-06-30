import { readJsonFile } from '@nx/devkit';
import { existsSync } from 'fs';
import path from 'path';

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

    let rootDirectory = process.cwd();

    while (!existsSync(path.join(rootDirectory, 'nx.json'))) {
        const parentDirectory = path.dirname(rootDirectory);
        if (parentDirectory === rootDirectory) {
            break;
        }
        rootDirectory = parentDirectory;
    }

    const rootPackageJson = readJsonFile(
        path.join(rootDirectory, 'package.json'),
    );

    return (
        latestVersion ||
        process.env['NX_VERSION'] ||
        rootPackageJson.devDependencies['@nx/workspace'] ||
        'latest'
    );
}
