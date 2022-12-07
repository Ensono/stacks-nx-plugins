import { joinPathFragments, logger, workspaceRoot } from '@nrwl/devkit';
import { ChildProcess, fork, execSync } from 'child_process';
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

        childFork.on('error', reject);
        childFork.on('disconnect', reject);
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

export function addUser(url: string) {
    const registryUrl = new URL(url);
    execSync(`npm set //${registryUrl.host}/:_authToken="ola"`);
}
