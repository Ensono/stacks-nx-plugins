import {
    checkFilesExist,
    readFile,
    readJson,
    runNxCommandAsync,
    uniq,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import * as os from 'os';
import path from 'path';
import { cwd } from 'process';

import { cleanup } from './cleanup';
import {
    getPackageManagerNxCreateCommand,
    getSelectedPackageManager,
    installNxPackages,
    installPackages,
} from './package-manager';
import { SupportedNxPreset, SupportedPackageManager } from './types';

let rootDirectory = path.join(__dirname, '../../../../../');

export interface CreateWorkspaceOptions {
    preset: SupportedNxPreset;
    packageManager: SupportedPackageManager;
    args?: string;
}

function install(
    directory: string,
    packagesToInstall: string[],
    development = false,
) {
    execSync(
        `npm install ${
            development ? '--save-dev' : ''
        } ${packagesToInstall.join(' ')}`,
        {
            cwd: directory,
            stdio: 'pipe',
        },
    );
}

function pack(directoryToPack: string, packDestination: string) {
    execSync(`npm pack --pack-destination ${packDestination}`, {
        cwd: directoryToPack,
        stdio: 'pipe',
    });
}

function build(packageToBuild: string) {
    execSync(`nx build ${packageToBuild}`, {
        stdio: 'pipe',
        cwd: rootDirectory,
    });
}

function getStacksPackageInformation(): Map<string, string> {
    const packages = path.join(__dirname, '../../../../');
    const childFolders = fs.readdirSync(packages, {
        withFileTypes: true,
    });
    const projectInformation = new Map<string, string>();
    childFolders.forEach(folder => {
        if (folder.isDirectory()) {
            const packageJsonPath = path.join(
                packages,
                folder.name,
                'package.json',
            );
            if (fs.existsSync(packageJsonPath)) {
                projectInformation.set(
                    readJson(packageJsonPath).name,
                    folder.name,
                );
            }
        }
    });
    return projectInformation;
}

function prepareTemporaryWorkspace() {
    const buildFolder = path.join(rootDirectory, 'dist', 'packages');
    const temporaryDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), Math.random().toString(36).slice(2, 7)),
    );
    build('create');
    pack(path.join(buildFolder, 'common', 'test'), temporaryDirectory);
    pack(path.join(buildFolder, 'common', 'core'), temporaryDirectory);
    pack(path.join(buildFolder, 'create'), temporaryDirectory);
    // TODO: Programatically ensure that any @nx dependencies are installed
    // TODO: Merge all these installs into one npm install command
    install(temporaryDirectory, [
        '@nx/devkit@16.3.2',
        'ensono-stacks-test-0.0.4-alpha-162.0.tgz',
        'ensono-stacks-core-0.9.4-alpha-166.0.tgz',
        'ensono-stacks-create-stacks-workspace-0.5.36-alpha-166.0.tgz',
    ]);
    // Next steps, switch to the created project, rerun the install for common core etc, then install workspace again
    return { buildFolder, temporaryDirectory };
}

export async function runCreateWorkspace(
    options: CreateWorkspaceOptions,
    temporaryDirectory,
) {
    // TODO: Look at switching to pnpm for faster usage
    const createCommand = getPackageManagerNxCreateCommand(
        options.packageManager,
    );

    const projectName = 'proj';

    const command = `${createCommand} ${projectName} --preset=${
        options.preset || 'apps'
    } --packageManager=${
        options.packageManager
    } --business.company=Amido --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --pipeline=azdo --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container' --vcs.type=github --vcs.url=amidostacks.git --cli=nx --no-nxCloud --no-interactive'`;
    execSync(command, { cwd: temporaryDirectory, stdio: 'pipe' });
    return path.join(temporaryDirectory, projectName);
}

export async function newProject(
    stacksPackagesToInstall: string[],
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
    // const { buildFolder, temporaryDirectory } =
    //     await prepareTemporaryWorkspace();

    const buildFolder =
        'C:\\Users\\dphillips\\Documents\\code\\stacks-nx-plugins\\dist\\packages';
    rootDirectory =
        'C:\\Users\\dphillips\\Documents\\code\\stacks-nx-plugins\\';
    const temporaryDirectory =
        'C:\\Users\\DPHILL~1\\AppData\\Local\\Temp\\qlge2T1bxoW';
    const workspace = path.join(temporaryDirectory, 'proj');
    // const workspace = await runCreateWorkspace(config, temporaryDirectory);

    install(
        workspace,
        [
            '../ensono-stacks-test-0.0.4-alpha-162.0.tgz',
            '../ensono-stacks-core-0.9.4-alpha-166.0.tgz',
            '../ensono-stacks-create-stacks-workspace-0.5.36-alpha-166.0.tgz',
        ],
        true,
    );

    const stacksPackages = getStacksPackageInformation();
    // TODO: Check package has a match
    stacksPackagesToInstall.forEach(plugin => {
        const pluginToBuild = stacksPackages.get(plugin);
        build(pluginToBuild);
        pack(path.join(buildFolder, pluginToBuild), workspace);
        install(
            workspace,
            // Do something fancy here so that we then bulk install all required packages
            ['ensono-stacks-logger-0.0.37-alpha-166.0.tgz'],
            true,
        );
    });
    // await installProjectPackages(packageManager, packagesToInstall);
    // await installNxPackages(packageManager, nxPackagesToInstall);
}
