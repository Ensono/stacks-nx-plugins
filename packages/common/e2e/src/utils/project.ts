import { runNxCommandAsync, tmpProjPath } from '@nx/plugin/testing';
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
    version?: string;
}

export async function runCreateWorkspace(
    name: string,
    options: CreateWorkspaceOptions,
) {
    const temporaryDirectory = path.join(process.cwd(), 'tmp', name);
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(temporaryDirectory), { recursive: true });

    const command = `${await getPackageManagerNxCreateCommand(
        options.packageManager,
        options.version,
    )} --name=${name} --preset=${options.preset || 'apps'} --packageManager=${
        options.packageManager
    } --skipGit --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --vcs.url=amidostacks.git --cli=nx --nxCloud=skip --no-interactive ${
        options.args ?? ''
    }`;
    logger.log(`[create] Running create command:\n${command}`);
    try {
        execSync(command, {
            cwd: path.dirname(temporaryDirectory),
            env: {
                ...process.env,
                HUSKY: '0',
            },
            stdio: 'inherit',
        });
    } catch (error) {
        console.log(error.stderr);
        throw new Error(`Create workspace failed: ${error}`);
    }
    return temporaryDirectory;
}

export async function newProject(
    name: string,
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
    const result = await runCreateWorkspace(name, {
        preset: 'apps' as SupportedNxPreset,
        packageManager,
        ...options,
    });
    logger.log(`[create-stacks-workspace] created ${name}`);
    await installVersionedPackages(packageManager, stacksPackagesToInstall);
    await installNxPackages(packageManager, nxPackagesToInstall);
    return result;
}

export async function createNextApplication(
    project: string,
    customServer?: boolean,
    deployment?: boolean,
) {
    const server = customServer ? '--customServer' : '';
    await runNxCommandAsync(
        `generate @nx/next:application ${project} --directory=apps --e2eTestRunner=none ${server}`,
    );
    await runNxCommandAsync(
        `generate @ensono-stacks/next:init --project=${project} --directory=apps --no-interactive`,
    );
    if (deployment) {
        await runNxCommandAsync(
            `generate @ensono-stacks/next:init-deployment --directory=apps --project=${project} --no-interactive`,
        );
    }
}
