import {
    ExecutorContext,
    getDependentPackagesForProject,
    WorkspaceLibrary,
    ProjectGraph,
    readTargetOptions,
    runExecutor,
    logger,
    joinPathFragments,
    readJsonFile,
    writeJsonFile,
} from '@nrwl/devkit';
import { jestExecutor } from '@nrwl/jest/src/executors/jest/jest.impl';
import { tmpProjPath } from '@nrwl/nx-plugin/testing';
import { ChildProcess } from 'child_process';
import fs from 'fs';
import semver from 'semver';

import { addUser, startVerdaccio } from '../../utils/registry';
import { End2EndExecutorSchema } from './schema';

function filterPublishableLibraries(
    libraries: WorkspaceLibrary[],
    projectGraph: ProjectGraph,
) {
    return libraries.filter(library => {
        const projectNode = projectGraph.nodes[library.name];
        return projectNode.data?.targets?.publish;
    });
}

async function chain([executor, ...list]: Array<() => Promise<any>>) {
    if (executor) {
        await executor();
        await chain(list);
    }
}

export default async function runEnd2EndExecutor(
    options: End2EndExecutorSchema,
    context: ExecutorContext,
) {
    const verdaccioUrl = `http://localhost:4872/`;
    process.env.npm_config_registry = verdaccioUrl;
    process.env.YARN_REGISTRY = process.env.npm_config_registry;

    // https://github.com/nrwl/nx/issues/11205
    const { npmScope } = readJsonFile(
        joinPathFragments(context.root, 'nx.json'),
    );

    // Remove previously published packages
    // TODO: read verdaccio yml to get path to storage
    const verdaccioStoragePath = joinPathFragments(
        context.root,
        'tmp',
        'local-registry',
        'storage',
    );

    if (fs.existsSync(verdaccioStoragePath)) {
        const orgPackagePath = joinPathFragments(
            verdaccioStoragePath,
            `@${npmScope}`,
        );
        if (fs.existsSync(orgPackagePath)) {
            fs.rmSync(orgPackagePath, { recursive: true, force: true });
        }
        writeJsonFile(
            joinPathFragments(verdaccioStoragePath, '.verdaccio-db.json'),
            {},
        );
    }

    if (!fs.existsSync(tmpProjPath())) {
        fs.mkdirSync(tmpProjPath(), { recursive: true });
    }

    let child: ChildProcess;
    logger.log(`[${context.projectName}] Starting Verdaccio`);
    try {
        child = await startVerdaccio(options.verdaccioConfig);
    } catch {
        logger.log(`Verdaccio already running...`);
    }

    try {
        addUser(verdaccioUrl);
    } catch (error) {
        logger.debug(error);
    }

    const { workspaceLibraries } = getDependentPackagesForProject(
        context.projectGraph,
        context.projectName,
    );

    const publishableLibraries = filterPublishableLibraries(
        workspaceLibraries,
        context.projectGraph,
    );

    let success = false;

    try {
        const publishPromises = publishableLibraries.map(library => {
            // We need to patch the version higher than whats on npm
            // as verdaccio will validate versions via it's proxies
            const distOutput = readTargetOptions(
                { project: library.name, target: 'build' },
                context,
            ).outputPath;
            const packageJson = readJsonFile(
                joinPathFragments(context.root, distOutput, 'package.json'),
            );
            const version = semver.inc(packageJson.version, 'patch');
            return async () =>
                runExecutor(
                    { project: library.name, target: 'publish' },
                    {
                        ...readTargetOptions(
                            { project: library.name, target: 'publish' },
                            context,
                        ),
                        noBuild: true,
                        packageVersion: version,
                    },
                    context,
                );
        });

        await chain(publishPromises);

        logger.log(`[${context.projectName}] Executing jest tests`);

        const result = await jestExecutor(
            {
                ...options.jestOptions,
                watch: false,
                runInBand: true,
                maxWorkers: 1,
                testTimeout: 120_000,
            },
            context,
        );
        success = result.success;
    } catch (error) {
        logger.error(error.message);
        success = false;
    }

    if (child) {
        child.kill();
    }

    process.on('exit', () => {
        if (child) {
            child.kill();
        }
    });

    return {
        success,
    };
}
