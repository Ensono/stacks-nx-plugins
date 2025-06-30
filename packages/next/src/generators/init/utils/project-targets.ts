import {
    ProjectConfiguration,
    Tree,
    updateProjectConfiguration,
    TargetConfiguration,
} from '@nx/devkit';
import { NextServeBuilderOptions } from '@nx/next';

export function getPort(project: ProjectConfiguration) {
    return project.targets?.serve?.options?.port || 3000;
}

/**
 * With Nx 18+ tasks are mostly inferred, but lack control over launching and building the app
 * @param tree Tree
 * @param project ProjectConfiguration
 * @returns
 */
export function updateProjectTargets(
    tree: Tree,
    project: ProjectConfiguration,
) {
    const update = { ...project };

    const hasBuildTargetExecutor =
        project.targets?.['build']?.executor === '@nx/next:build';

    // The inferred task for building a Next application does not correctly build
    // a valid package.json required for deploying the application into a Dockerfile
    if (!hasBuildTargetExecutor) {
        update.targets.build = {
            ...update.targets.build,
            executor: '@nx/next:build',
            outputs: ['{options.outputPath}'],
            defaultConfiguration: 'production',
            options: {
                outputPath: `dist/${project.root}`,
            },
            configurations: {
                development: {
                    outputPath: project.root,
                },
                production: {
                    outputPath: `dist/${project.root}`,
                },
            },
        };
    }

    const isCustomServer =
        project.targets?.['build-custom-server'] &&
        project.targets?.['serve-custom-server'];

    const serveTarget: TargetConfiguration<Partial<NextServeBuilderOptions>> = {
        executor: '@nx/next:server',
        defaultConfiguration: 'development',
        options: {
            buildTarget: `${project.name}:build:development`,
            dev: true,
            port: getPort(update),
        },
        configurations: {
            development: {
                buildTarget: `${project.name}:build:development`,
                dev: true,
            },
            production: {
                buildTarget: `${project.name}:build:production`,
                dev: false,
            },
        },
    };

    // Nx will not create a target that is able to launch/build both the custom server and the next application
    // So we create a `serve` command
    if (isCustomServer) {
        serveTarget.options.customServerTarget = `${project.name}:serve-custom-server`;
        serveTarget.configurations.development.customServerTarget = `${project.name}:serve-custom-server:development`;
        serveTarget.configurations.production.customServerTarget = `${project.name}:serve-custom-server:production`;
    }

    update.targets.serve = serveTarget;

    updateProjectConfiguration(tree, project.name, update);
}
