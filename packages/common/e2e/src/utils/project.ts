import { tmpProjPath } from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
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
    const createCommand = getPackageManagerNxCreateCommand(
        options.packageManager,
    );

    let command = `${createCommand} proj --preset=${
        options.preset || 'apps'
    } --packageManager=${options.packageManager}`;
    command +=
        ' --business.company=Amido --business.domain=Stacks --business.component=Nx';
    command += ' --cloud.platform=azure --cloud.region=euw';
    command +=
        ' --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com';
    command += ' --pipeline=azdo';
    command +=
        ' --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container';
    command += ' --vcs.type=github --vcs.url=amidostacks.git';
    command += ' --cli=nx --no-nxCloud --no-interactive';

    if (options.args) {
        command += ` ${options.args}`;
    }

    if (!fs.existsSync(temporaryDirectory)) {
        fs.mkdirSync(temporaryDirectory, { recursive: true });
    }

    const create = execSync(command, {
        cwd: temporaryDirectory,
        env: {
            ...process.env,
            HUSKY: '0',
        },
        stdio: 'pipe',
    });

    return create ? create.toString() : '';
}

export async function newProject(
    packagesToInstall: string[],
    nxPackagesToInstall: string[] = [],
    options: Partial<CreateWorkspaceOptions> = {},
) {
    process.env.HUSKY = '0';
    const packageManager = getSelectedPackageManager();

    const config = {
        preset: 'apps' as SupportedNxPreset,
        packageManager,
        ...options,
    };

    cleanup();
    runCreateWorkspace(config);
    await installVersionedPackages(packageManager, packagesToInstall);
    await installNxPackages(packageManager, nxPackagesToInstall);
}
