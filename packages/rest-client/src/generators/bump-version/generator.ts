import { formatFiles, generateFiles, Tree } from '@nrwl/devkit';
import path from 'path';

import { BumpVersionGeneratorSchema } from './schema';

function copyFilesAndBumpVersion(
    tree: Tree,
    options: BumpVersionGeneratorSchema,
) {
    const templateOptions = {
        ...options,
        template: '',
    };

    const absoluteEndpointPath = path.join(
        options.endpointPath,
        options.endpoint,
    );

    const currentVersion: string = tree
        .children(absoluteEndpointPath)
        .sort()
        .reverse()[0];

    if (!currentVersion) {
        throw new Error(`No version could be found for endpoint`);
    }

    if (
        Number(currentVersion.replace('V', '')) >=
        Number(options.endpointVersion)
    ) {
        throw new Error('Cannot bump to previous or current version');
    }

    generateFiles(
        tree,
        path.join(absoluteEndpointPath, currentVersion),
        path.join(absoluteEndpointPath, `V${options.endpointVersion}`),
        templateOptions,
    );
}

export default async function bumpVersion(
    tree: Tree,
    options: BumpVersionGeneratorSchema,
) {
    if (Number.isNaN(Number(options.endpointVersion))) {
        throw new TypeError('The endpoint version needs to be a number.');
    }

    copyFilesAndBumpVersion(tree, options);

    await formatFiles(tree);
}
