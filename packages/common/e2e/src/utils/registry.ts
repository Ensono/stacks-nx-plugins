import { joinPathFragments, workspaceRoot } from '@nrwl/devkit';
import { tmpProjPath } from '@nrwl/nx-plugin/testing';
import { ChildProcess, fork, execSync } from 'child_process';
import fs from 'fs';
import { URL } from 'url';

export function runRegistry(
    args: string[] = [],
    childOptions = {},
): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const childFork = fork(
            require.resolve('verdaccio/bin/verdaccio'),
            args,
            {
                stdio: 'ignore',
                ...childOptions,
            },
        );

        childFork.on('message', (message: { verdaccio_started: boolean }) => {
            if (message.verdaccio_started) {
                resolve(childFork);
            }
        });

        childFork.on('error', error => reject(error));
        childFork.on('disconnect', error => reject(error));
    });
}

export async function startVerdaccio(verdaccioConfig: string) {
    const port = 4872;
    return runRegistry(
        [
            '-c',
            joinPathFragments(workspaceRoot, verdaccioConfig),
            '-l',
            `${port}`,
        ],
        {},
    );
}

function getNpmConfigPath() {
    const raw = execSync(`npm config list --json`, {
        cwd: tmpProjPath(),
        env: process.env,
    });

    const { userconfig } = JSON.parse(raw.toString());
    return userconfig;
}

export function addUser(url: string) {
    const configPath =
        process.env['NPM_CONFIG_USERCONFIG'] || getNpmConfigPath();

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, '');
        process.env['NPM_CONFIG_USERCONFIG'] = configPath;
    }

    const registryUrl = new URL(url);
    execSync(`npm config set //${registryUrl.host}/:_authToken="ola"`, {
        cwd: tmpProjPath(),
        env: process.env,
        stdio: 'pipe',
    });
}
