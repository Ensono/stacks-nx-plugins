import { tmpProjPath } from '@nx/plugin/testing';
import { execSync } from 'child_process';
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

export function runCreateWorkspace(options: CreateWorkspaceOptions) {
    const temporaryDirectory = path.dirname(tmpProjPath());
    const projectName = 'proj';
    logger.log(
        '[create] No workspace backup found, creating new workspace backup',
    );
    emptyDirSync(temporaryDirectory);
    logger.log(`[create] Created temporary directory: ${temporaryDirectory}`);
    const command = `${getPackageManagerNxCreateCommand(
        options.packageManager,
    )} ${projectName} --preset=${options.preset || 'apps'} --packageManager=${
        options.packageManager
    } --skipGit --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --vcs.url=amidostacks.git --cli=nx --no-nxCloud --no-interactive ${
        options.args ?? ''
    }`;
    logger.log(`[create] Running create command:\n${command}`);
    execSync(command, {
        cwd: temporaryDirectory,
        env: {
            ...process.env,
            HUSKY: '0',
        },
        stdio: 'inherit',
    });
    return `${projectName} created in ${temporaryDirectory}`;
}

export async function newProject(
    stacksPackageToInstall?: string,
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
    const result = runCreateWorkspace({
        preset: 'apps' as SupportedNxPreset,
        packageManager,
        ...options,
    });
    logger.log(`[create-stacks-workspace] ${result}`);
    await installVersionedPackages(packageManager, stacksPackageToInstall);
    await installNxPackages(packageManager, nxPackagesToInstall);
}
