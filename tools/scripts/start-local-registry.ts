/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */

/// <reference path="registry.d.ts" />

import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { releasePublish, releaseVersion } from 'nx/release';
import path from 'path';

export default async () => {
    // local registry target to run
    const localRegistryTarget = 'stacks-nx-plugins:local-registry';
    // storage folder for the local registry
    const storage = './tmp/local-registry/storage';

    const stopRegistry = await startLocalRegistry({
        localRegistryTarget,
        storage,
        verbose: false,
    });

    global.stopLocalRegistry = function () {
        stopRegistry();
        process.exit(0);
    };

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

    process.env.NX_CACHE_PROJECT_GRAPH = 'false';

    // Because the process is already running set the env variable
    process.env.npm_config_cache_dir = npmCacheDirectory + '/cache';
    process.env.npm_config_store_dir = npmCacheDirectory + '/store';
    execSync(`pnpm cache delete @ensono-stacks/*`, { stdio: [0, 1, 2] });

    const { releaseGraph, projectsVersionData } = await releaseVersion({
        specifier: '0.0.0-e2e',
        stageChanges: false,
        gitCommit: false,
        gitTag: false,
        firstRelease: true,
        versionActionsOptionsOverrides: {
            skipLockFileUpdate: true,
            packageRoot: '{projectRoot}',
        },
    });

    await releasePublish({
        releaseGraph,
        versionData: projectsVersionData,
        tag: 'e2e',
        firstRelease: true,
    });
};
