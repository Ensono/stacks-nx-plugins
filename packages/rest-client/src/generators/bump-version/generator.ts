import { normalizeOptions, copyFiles } from '@ensono-stacks/core';
import { formatFiles, getWorkspaceLayout, Tree } from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';

import { BumpVersionGeneratorSchema } from './schema';

function findLatestVersion(
    tree: Tree,
    { directory, endpointName }: { directory?: string; endpointName: string },
): number {
    const pathElements = [
        getWorkspaceLayout(tree).libsDir,
        directory,
        endpointName,
    ].filter(Boolean) as string[];
    const versionsPath = path.join(...pathElements);
    const children = tree.children(versionsPath);

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
    const newVersion = Number(newVersionParameter ?? latestVersion + 1);

    if (Number.isNaN(newVersion)) {
        throw new TypeError('The endpoint version needs to be a number.');
    }

    if (newVersion <= latestVersion) {
        throw new Error(
            `Cannot decrease a version. Please use --endpointVersion higher than ${newVersion}`,
        );
    }

    return newVersion;
}

export default async function bumpVersion(
    tree: Tree,
    optionsParameter: BumpVersionGeneratorSchema,
) {
    const latestVersion = findLatestVersion(tree, {
        directory: optionsParameter.directory,
        endpointName: optionsParameter.name,
    });
    const newVersion = determineNewVersion(
        latestVersion,
        optionsParameter.endpointVersion,
    );

    const latestVersionOptions = normalizeOptions(tree, {
        name: `${optionsParameter.name}/v${latestVersion}`,
        directory: optionsParameter.directory,
        endpointName: optionsParameter.name,
        endpointVersion: latestVersion,
    });

    const newVersionOptions = normalizeOptions(tree, {
        ...optionsParameter,
        // include endpoint version in library name
        name: `${optionsParameter.name}/v${newVersion}`,
        endpointName: optionsParameter.name,
        endpointVersion: newVersion,
    });

    // create a new library for the new version
    await libraryGenerator(tree, newVersionOptions);
    // Delete the default generated lib folder
    tree.delete(path.join(newVersionOptions.projectRoot, 'src', 'lib'));

    // copy src files from latestVersion to newVersion
    copyFiles(
        tree,
        path.join(latestVersionOptions.projectRoot, 'src'),
        path.join(newVersionOptions.projectRoot, 'src'),
    );


    await formatFiles(tree);
}
