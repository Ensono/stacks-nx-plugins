import {
    normalizeOptions,
    copyFiles,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { formatFiles, names, readProjectConfiguration, Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { BumpVersionGeneratorSchema } from './schema';

function findLatestVersion(
    tree: Tree,
    { endpointName }: { endpointName: string },
): number {
    const versionFolderConvention = /v(\d+)$/g;
    let children;
    try {
        const versionsPath = readProjectConfiguration(tree, endpointName);
        const versionFolderFromPath = versionsPath.root.replaceAll(
            versionFolderConvention,
            '',
        );

        children = tree.children(versionFolderFromPath);
    } catch {
        throw new Error(
            "Could not find previous version of the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    }

    if (children.length === 0) {
        throw new Error(
            "No version is present for the endpoint. Are you sure you don't want to generate a new endpoint?",
        );
    }

    if (
        children.some(folderName => !versionFolderConvention.test(folderName))
    ) {
        throw new Error(
            "Found a folder that does not follow convention, please follow 'v<number>'",
        );
    }

    const versions = children.map(version =>
        Number.parseInt(version.replace(/^v/i, ''), 10),
    );

    console.log('versions:', versions);

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
    latestVersion: number,
    latestVersionName: string,
    newVersion: number,
    newVersionName: string,
) {
    const latestVersionNames = names(latestVersionName);
    const newVersionNames = names(newVersionName);

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
                    new RegExp(latestVersionNames.className, 'g'),
                    newVersionNames.className,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(latestVersionNames.name, 'g'),
                    newVersionNames.name,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(`v${latestVersion}`, 'g'),
                    `v${newVersion}`,
                )
                .replaceAll(
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    new RegExp(`V${latestVersion}`, 'g'),
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

    const latestVersion = findLatestVersion(tree, {
        endpointName: optionsParameter.name,
    });

    if (Number.isNaN(latestVersion)) {
        throw new TypeError(
            `No version found. Please select your project with existing endpoints.`,
        );
    }

    const newVersion = determineNewVersion(
        latestVersion,
        optionsParameter.endpointVersion,
    );

    const libsEndpoint = readProjectConfiguration(
        tree,
        optionsParameter.name,
    ).root.replaceAll(/v(\d+)$/g, '');

    const endpointRoot = libsEndpoint.replace('libs/', '');

    const latestVersionOptions = normalizeOptions(tree, {
        name: `${endpointRoot}v${latestVersion}`,
        endpointName: endpointRoot,
        endpointVersion: latestVersion,
    });

    const newVersionOptions = normalizeOptions(tree, {
        ...optionsParameter,
        // include endpoint version in library name
        name: `${endpointRoot}v${newVersion}`,
        endpointName: endpointRoot,
        endpointVersion: newVersion,
    });
    // create a new library for the new version
    await libraryGenerator(tree, newVersionOptions);
    // Delete the default generated lib folder
    tree.delete(path.join(newVersionOptions.projectRoot, 'src', 'lib'));

    // copy files from latestVersion to newVersion
    copyFiles(
        tree,
        latestVersionOptions.projectRoot,
        newVersionOptions.projectRoot,
    );

    // update version numbers in the newly created files
    const filesToChange = tree
        .listChanges()
        .filter(change =>
            isRelative(newVersionOptions.projectRoot, change.path),
        )
        .map(change => change.path);
    updateVersionInCode(
        tree,
        filesToChange,
        latestVersion,
        latestVersionOptions.name,
        newVersion,
        newVersionOptions.name,
    );

    await formatFiles(tree);
}
