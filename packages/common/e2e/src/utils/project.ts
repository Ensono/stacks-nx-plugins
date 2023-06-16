import { tmpProjPath } from '@nx/plugin/testing';
import { execSync } from 'child_process';
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

export function runCreateWorkspace(options: CreateWorkspaceOptions) {
    const temporaryDirectory = path.dirname(tmpProjPath());
    logger.log(`[create] Created temporary directory: ${temporaryDirectory}`);
    const command = `${getPackageManagerNxCreateCommand(
        options.packageManager,
    )} proj --preset=${options.preset || 'apps'} --packageManager=${
        options.packageManager
    } --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --vcs.url=amidostacks.git --cli=nx --no-nxCloud --no-interactive ${
        options.args ?? ''
    }`;
    logger.log(`[create] Running create command: ${command}`);
    return execSync(command, {
        cwd: temporaryDirectory,
        env: {
            ...process.env,
            HUSKY: '0',
        },
        stdio: 'pipe',
    }).toString();
}

export async function newProject(
    packagesToInstall: string[],
    nxPackagesToInstall: string[] = [],
    options: Partial<CreateWorkspaceOptions> = {},
) {
    if (!process.env.npm_config_registry) {
        throw new Error(
            'Verdaccio is not running. Have you stared this test with the e2e executor?',
        );
    }
    process.env.HUSKY = '0';
    const packageManager = getSelectedPackageManager();
    cleanup();
    runCreateWorkspace({
        preset: 'apps' as SupportedNxPreset,
        packageManager,
        ...options,
    });
    await installVersionedPackages(packageManager, packagesToInstall);
    await installNxPackages(packageManager, nxPackagesToInstall);
}
