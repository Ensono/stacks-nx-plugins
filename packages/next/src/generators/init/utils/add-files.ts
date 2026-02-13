import {
    ProjectConfiguration,
    Tree,
    generateFiles,
    detectPackageManager,
    offsetFromRoot,
    getPackageManagerCommand,
    getPackageManagerVersion,
} from '@nx/devkit';
import path from 'path';
import semver from 'semver';

import { getPort } from './project-targets';

export function addFiles(tree: Tree, project: ProjectConfiguration) {
    // Parent directory for .next production build.
    // If using inferred task nx will place this in the project root.
    const nextDistributionPath =
        project.targets?.build?.options?.outputPath ?? project.root;
    const customServerDistributionPath =
        project.targets?.['build-custom-server']?.options?.outputPath ?? '';

    const port = getPort(project);
    const packageManager = detectPackageManager();
    const packageManagerVersion = getPackageManagerVersion(packageManager);
    const { install } = getPackageManagerCommand(packageManager);
    let installCommand = install;

    if (packageManager === 'pnpm') {
        installCommand += ' --prod';
    }
    if (packageManager === 'npm') {
        installCommand += ' --omit=dev';
    }
    if (packageManager === 'yarn') {
        const majorVersion = semver.major(packageManagerVersion);

        if (majorVersion >= 3) {
            installCommand = 'yarn workspaces focus --production';
        } else {
            installCommand += ' --production';
        }
    }

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', 'common'),
        project.root,
        {
            customServerDistributionPath,
            nextDistributionPath,
            packageManagerInstallCommand: installCommand,
            port,
            projectName: project.name,
            root: project.root,
            template: '',
        },
    );

    if (customServerDistributionPath) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'custom-server'),
            project.root,
            {
                port,
                projectRoot: project.root,
                relativeProjectRoot: path.join(
                    offsetFromRoot(
                        path.join(customServerDistributionPath, 'server'),
                    ),
                    nextDistributionPath,
                ),
                template: '',
            },
        );
    }

    return () => {};
}
