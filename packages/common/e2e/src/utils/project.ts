import { runNxCommandAsync, tmpProjPath, uniq } from '@nx/plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import { emptyDirSync } from 'fs-extra';
import { logger } from 'nx/src/utils/logger';
import path from 'path';

import { cleanup } from './cleanup';
import {
    getPackageManagerNxCreateCommand,
    getSelectedPackageManager,
    installVersionedPackages,
    installNxPackages,
} from './package-manager';
import { SupportedNxPreset, SupportedPackageManager } from './types';

export interface CreateWorkspaceOptions {
    preset: SupportedNxPreset;
    packageManager: SupportedPackageManager;
    args?: string;
}

export async function runCreateWorkspace(options: CreateWorkspaceOptions) {
    const temporaryDirectory = path.dirname(tmpProjPath());
    const projectName = uniq('proj');
    emptyDirSync(temporaryDirectory);
    logger.log(`[create] Created temporary directory: ${temporaryDirectory}`);

    const cacheDirectory = path.join(temporaryDirectory, '.cache');
    if (!fs.existsSync(cacheDirectory)) {
        fs.mkdirSync(cacheDirectory, {
            recursive: true,
        });
    }
    const command = `${await getPackageManagerNxCreateCommand(
        options.packageManager,
    )} --name=${projectName} --preset=${
        options.preset || 'apps'
    } --packageManager=${
        options.packageManager
    } --skipGit --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --vcs.url=amidostacks.git --cli=nx --no-nxCloud --no-interactive ${
        options.args ?? ''
    }`;
    logger.log(`[create] Running create command:\n${command}`);
    try {
        execSync(command, {
            cwd: temporaryDirectory,
            env: {
                ...process.env,
                npm_config_cache: cacheDirectory,
                HUSKY: '0',
            },
            stdio: 'inherit',
        });
    } catch (error) {
        throw new Error(`Create workspace failed: ${error}`);
    }
    return `${projectName} created in ${temporaryDirectory}`;
}

export async function newProject(
    stacksPackagesToInstall?: string[],
    nxPackagesToInstall: string[] = [],
    options: Partial<CreateWorkspaceOptions> = {},
) {
    if (!process.env.npm_config_registry) {
        throw new Error(
            'Verdaccio is not running. Have you started this test with the e2e executor?',
        );
    }
    process.env.HUSKY = '0';
    const packageManager = getSelectedPackageManager();
    cleanup();
    const result = await runCreateWorkspace({
        preset: 'apps' as SupportedNxPreset,
        packageManager,
        ...options,
    });
    logger.log(`[create-stacks-workspace] ${result}`);
    await installVersionedPackages(packageManager, stacksPackagesToInstall);
    await installNxPackages(packageManager, nxPackagesToInstall);
}

export async function createNextApplication(
    project: string,
    customServer?: boolean,
    deployment?: boolean,
) {
    const server = customServer ? '--customServer' : '';
    await runNxCommandAsync(
        `generate @nx/next:application ${project} --e2eTestRunner=none --no-appDir ${server}`,
    );
    await runNxCommandAsync(
        `generate @ensono-stacks/next:init --project=${project} --no-interactive`,
    );
    if (deployment) {
        await runNxCommandAsync(
            `generate @ensono-stacks/next:init-deployment --project=${project} --no-interactive`,
        );
    }
}
