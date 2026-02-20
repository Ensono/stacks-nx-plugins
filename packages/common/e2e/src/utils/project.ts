import { runNxCommandAsync, tmpProjPath, updateFile } from '@nx/plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import { logger } from 'nx/src/utils/logger';
import path from 'path';

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
    const temporaryDirectory = tmpProjPath();

    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(temporaryDirectory), { recursive: true });

    const command = `${await getPackageManagerNxCreateCommand(
        options.packageManager,
    )} --name=proj --preset=${options.preset || 'ts'} --packageManager=${
        options.packageManager
    } --stacksVersion=e2e --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --vcs.type=github --vcs.url=amidostacks.git --cli=nx --nxCloud=skip --no-interactive ${
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
        throw new Error(`Create workspace failed: ${error}`);
    }

    return temporaryDirectory;
}

export async function newProject(
    stacksPackagesToInstall: string[] = [],
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

    const directory = await runCreateWorkspace({
        preset: 'ts' as SupportedNxPreset,
        packageManager,
        ...options,
    });

    if (packageManager === 'pnpm') {
        updateFile(
            '.npmrc',
            'prefer-frozen-lockfile=false\nstrict-peer-dependencies=false\nauto-install-peers=true',
        );
    }

    await installNxPackages(packageManager, nxPackagesToInstall);
    await installVersionedPackages(packageManager, stacksPackagesToInstall);

    return directory;
}

export async function createNextApplication(
    project: string,
    customServer?: boolean,
) {
    const server = customServer ? '--customServer' : '';

    await runNxCommandAsync(
        `generate @nx/next:application ${project} --directory=apps/${project} --linter=eslint --e2eTestRunner=none --unitTestRunner=none --style=none --appDir=true --src=true ${server} --no-interactive`,
    );
    await runNxCommandAsync('reset');
    await runNxCommandAsync(
        `generate @ensono-stacks/next:init --project=${project} --no-interactive`,
    );
}
