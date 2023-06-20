import {
    tmpProjPath,
    directoryExists,
    tmpBackupProjPath,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';
import { copySync, emptyDirSync, moveSync } from 'fs-extra';
import { logger } from 'nx/src/utils/logger';
import * as os from 'os';
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
    // Workspace created in system temp as unable to provision new workspace in default nx temp folders as repo is under git control
    const temporaryDirectory = path.join(
        os.tmpdir(),
        'stacks',
        options.packageManager,
    );
    const projectName = 'proj';
    const temporaryProjectDirectory = path.join(
        temporaryDirectory,
        projectName,
    );
    let createResult = 'Workspace created from workspace backup';
    if (!directoryExists(temporaryProjectDirectory)) {
        logger.log(
            '[create] No workspace backup found, creating new workspace backup',
        );
        emptyDirSync(temporaryDirectory);
        logger.log(
            `[create] Created temporary directory: ${temporaryDirectory}`,
        );
        const command = `${getPackageManagerNxCreateCommand(
            options.packageManager,
        )} ${projectName} --preset=${
            options.preset || 'apps'
        } --packageManager=${
            options.packageManager
        } --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --vcs.url=amidostacks.git --cli=nx --no-nxCloud --no-interactive ${
            options.args ?? ''
        }`;
        logger.log(
            `[create] Running create command in ${temporaryDirectory}: ${command}`,
        );
        execSync(command, {
            cwd: temporaryDirectory,
            env: {
                ...process.env,
                HUSKY: '0',
            },
            stdio: 'inherit',
        });
        createResult = `New workspace created from clean installation`;
    }
    logger.log(
        `[create] Workspace backup found. Taking copy from: ${temporaryProjectDirectory}`,
    );
    copySync(temporaryProjectDirectory, tmpProjPath());
    return createResult;
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
