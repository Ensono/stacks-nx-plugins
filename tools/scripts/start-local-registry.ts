/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */

/// <reference path="registry.d.ts" />

import { ChildProcess, execSync, spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';

/**
 * Custom startLocalRegistry that works around nx module resolution issue.
 * The @nx/js version uses `require.resolve('nx')` which fails because
 * nx package has no main entry point. This version uses spawn with npx nx instead.
 */
function startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose = false,
    clearStorage = true,
    listenAddress = 'localhost',
}: {
    localRegistryTarget: string;
    storage?: string;
    verbose?: boolean;
    clearStorage?: boolean;
    listenAddress?: string;
}): Promise<() => void> {
    const timeoutMs = 60000;

    return new Promise<() => void>((resolve, reject) => {
        const args = [
            'nx',
            'run',
            localRegistryTarget,
            '--location',
            'none',
            '--clear',
            String(clearStorage),
            ...(storage ? ['--storage', storage] : []),
        ];

        const childProcess: ChildProcess = spawn('pnpm', ['exec', ...args], {
            stdio: 'pipe',
            shell: true,
        });

        let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
        let resolved = false;

        const cleanup = () => {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        };

        const listener = (data: Buffer) => {
            if (verbose) {
                process.stdout.write(data);
                console.log('Waiting for local registry to start...');
            }
            if (data.toString().includes(`http://${listenAddress}:`)) {
                const port = parseInt(
                    data
                        .toString()
                        .match(new RegExp(`${listenAddress}:(?<port>\\d+)`))
                        ?.groups?.port ?? ''
                );

                const registry = `http://${listenAddress}:${port}`;
                const authToken = 'secretVerdaccioToken';

                console.log(`Local registry started on ${registry}`);

                process.env.npm_config_registry = registry;
                execSync(
                    `npm config set //${listenAddress}:${port}/:_authToken "${authToken}" --ws=false`,
                    { windowsHide: false }
                );

                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(() => {
                        childProcess.kill();
                        execSync(
                            `npm config delete //${listenAddress}:${port}/:_authToken --ws=false`,
                            { windowsHide: false }
                        );
                    });
                }
            }
        };

        timeoutHandle = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                childProcess.kill();
                reject(
                    new Error(
                        `Local registry failed to start within ${timeoutMs / 1000}s`,
                    ),
                );
            }
        }, timeoutMs);

        childProcess.stdout?.on('data', listener);
        childProcess.stderr?.on('data', listener);

        childProcess.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.log('local registry error', err);
                reject(err);
            }
        });

        childProcess.on('exit', (code) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.log('local registry exit', code);
                reject(
                    new Error(
                        `Local registry process exited with code ${code}`,
                    ),
                );
            }
        });
    });
}

export default async () => {
    // local registry target to run
    const localRegistryTarget = 'stacks-nx-plugins:local-registry';
    // storage folder for the local registry
    const storage = './tmp/local-registry/storage';

    global.stopLocalRegistry = await startLocalRegistry({
        localRegistryTarget,
        storage,
        verbose: false,
    });

    // Rewrite cache directory for npx commands to be reset between runs
    const npmCacheDirectory = path.resolve(
        process.cwd(),
        'tmp',
        'local-registry',
        '.npm',
    );

    if (existsSync(npmCacheDirectory)) {
        rmSync(npmCacheDirectory, {
            recursive: true,
            force: true,
        });
    }

    // Because the process is already running set the env variable
    process.env.npm_config_cache_dir = npmCacheDirectory + '/cache';
    process.env.npm_config_store_dir = npmCacheDirectory + '/store';
    execSync(`pnpm cache delete @ensono-stacks/*`, { stdio: [0, 1, 2] });

    // Dynamically import nx/release to avoid module resolution issues
    const { releaseVersion, releasePublish } = await import('nx/release');

    await releaseVersion({
        specifier: '0.0.0-e2e',
        stageChanges: false,
        gitCommit: false,
        gitTag: false,
        firstRelease: true,
        versionActionsOptionsOverrides: {
            skipLockFileUpdate: true,
            packageRoot: 'dist/{projectRoot}',
        },
    });

    await releasePublish({
        tag: 'e2e',
        firstRelease: true,
    });
};
