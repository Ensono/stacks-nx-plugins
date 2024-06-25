import {
    normalizeOptions,
    copyFiles,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    formatFiles,
    names,
    ProjectConfiguration,
    readJson,
    readProjectConfiguration,
    Tree,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { BumpVersionGeneratorSchema } from './schema';

function findTargetVersion(config: ProjectConfiguration): number {
    const versionDirectory = path.basename(config.root);

    if (!versionDirectory.startsWith('v')) {
        throw new Error(
            "Found a folder that does not follow convention, please follow 'v<number>'",
        );
    }

    const version = Number.parseInt(versionDirectory.replace(/^v/i, ''), 10);

    if (Number.isNaN(version)) {
        // eslint-disable-next-line unicorn/prefer-type-error
        throw new Error(
            "No version is present for the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    }

    return version;
}

function findLatestVersion(tree: Tree, config: ProjectConfiguration): number {
    let children;
    try {
        const apiDirectory = path.dirname(config.root);
        children = tree.children(apiDirectory);
    } catch {
        throw new Error(
            "Could not find previous version of the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    }

    if (children.length === 0) {
        throw new Error(
            "Could not find previous version of the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    }

    const versions = children.map(version =>
        Number.parseInt(version.replace(/^v/i, ''), 10),
    );

    return Math.max(...versions);
}

function determineNewVersion(
    latestVersion: number,
    newVersionParameter?: number | string,
): number {
    if (newVersionParameter !== undefined) {
        const newVersionNumber = Number(newVersionParameter);
        if (Number.isNaN(newVersionNumber)) {
            throw new TypeError('The endpoint version needs to be a number.');
        }
    }

    const newVersion = Number(newVersionParameter || latestVersion + 1);

    if (newVersion <= latestVersion) {
        throw new Error(
            `Cannot decrease a version. Please use --endpointVersion higher than ${latestVersion}`,
        );
    }

    return newVersion;
}

function updateVersionInCode(
    tree: Tree,
    filePaths: string[],
    currentVersion: number,
    currentEndpointName: string,
    newVersion: number,
    newEndpointName: string,
) {
    const currentEndpointNames = names(currentEndpointName);
    const newEndpointNames = names(newEndpointName);

    filePaths.forEach(filePath => {
        const fileContent = tree.read(filePath)?.toString();
        if (!fileContent) {
            return;
        }

        tree.write(
            filePath,
            fileContent
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(currentEndpointNames.className, 'g'),
                    newEndpointNames.className,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(currentEndpointNames.name, 'g'),
                    newEndpointNames.name,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(`v${currentVersion}`, 'g'),
                    `v${newVersion}`,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(`V${currentVersion}`, 'g'),
                    `V${newVersion}`,
                ),
        );
    });
}

function isRelative(parent: string, directory: string) {
    const relative = path.relative(parent, directory);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isEndpointVersionOptionIncorrectlyPresent(
    endpointVersion: number | undefined,
) {
    if (endpointVersion === undefined) {
        return false;
    }

    if (Number.isInteger(endpointVersion)) {
        return false;
    }

    if (Number.isNaN(endpointVersion)) {
        return true;
    }

    return false;
}

export default async function bumpVersion(
    tree: Tree,
    optionsParameter: BumpVersionGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, optionsParameter.name);

    const endpointVersionOptionIncorrectlyPresent =
        isEndpointVersionOptionIncorrectlyPresent(
            optionsParameter.endpointVersion,
        );
    if (endpointVersionOptionIncorrectlyPresent) {
        throw new TypeError(`The endpoint version needs to be a number.`);
    }

    const config = readProjectConfiguration(tree, optionsParameter.name);

    const targetVersion = findTargetVersion(config);
    const latestVersion = findLatestVersion(tree, config);

    const newVersion = determineNewVersion(
        latestVersion,
        optionsParameter.endpointVersion,
    );

    const apiDirectory = path.dirname(config.root);

    const newEndpointName = config.name?.replaceAll(
        /v(\d+)$/g,
        `v${newVersion}`,
    );

    const targetImportPath = readJson(
        tree,
        path.join(config.root, 'package.json'),
    ).name;

    const newImportPath = targetImportPath.replaceAll(
        /v(\d+)$/g,
        `v${newVersion}`,
    );

    const newProjectConfig = await determineProjectNameAndRootOptions(tree, {
        name: newEndpointName as string,
        directory: `${apiDirectory}/v${newVersion}`,
        projectNameAndRootFormat: 'as-provided',
        projectType: 'library',
        importPath: newImportPath,
        callingGenerator: '@nx/js',
    });

    // TODO: why do we generate a new lib? Cant we skip to copy and add tsconfig.base.json amends?
    // create a new library for the new version
    await libraryGenerator(tree, {
        name: newEndpointName as string,
        directory: `${apiDirectory}/v${newVersion}`,
        importPath: newImportPath,
        bundler: 'none',
        projectNameAndRootFormat: 'as-provided',
    });

    // Delete the default generated lib folder
    tree.delete(path.join(newProjectConfig.projectRoot, 'src', 'lib'));

    // copy files from latestVersion to newVersion
    copyFiles(tree, config.root, newProjectConfig.projectRoot);

    // update version numbers in the newly created files
    const filesToChange = tree
        .listChanges()
        .filter(change => isRelative(newProjectConfig.projectRoot, change.path))
        .map(change => change.path);

    updateVersionInCode(
        tree,
        filesToChange,
        targetVersion,
        config.name as string,
        newVersion,
        newEndpointName as string,
    );

    await formatFiles(tree);
}
