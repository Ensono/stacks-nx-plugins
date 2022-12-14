import { formatFiles, generateFiles, names, Tree } from '@nrwl/devkit';
import path from 'path';

import { ClientEndpointGeneratorSchema } from './schema';

interface NormalizedSchema extends ClientEndpointGeneratorSchema {
    endpointName: string;
    endpointDirectory: string;
    parsedTags: string[];
}

function normalizeOptions(
    options: ClientEndpointGeneratorSchema,
): NormalizedSchema {
    const name = names(options.name).fileName;
    const endpointDirectory = options.directory
        ? `${names(options.directory).fileName}/${name}`
        : name;
    const endpointName = endpointDirectory.replace(/\//g, '-');
    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        endpointName,
        endpointDirectory,
        parsedTags,
    };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        ...names(options.name),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, 'files'),
        path.join(
            options.directory,
            options.name,
            `V${options.endpointVersion.toString()}`,
        ),
        templateOptions,
    );
}

export default async function clientEndpoint(
    tree: Tree,
    options: ClientEndpointGeneratorSchema,
) {
    const normalizedOptions = normalizeOptions(options);

    if (Array.isArray(options.methods) && options.methods.length === 0) {
        throw new Error("You haven't selected any method to generate.");
    }

    addFiles(tree, normalizedOptions);

    // Add env variable
    let source = tree.exists('.env')
        ? (tree.read('.env') as Buffer).toString()
        : '';
    if (!source.includes(normalizedOptions.envVar)) {
        source = source !== '' ? `${source}\n` : '';
        source += `${normalizedOptions.envVar}=`;
        tree.write('.env', source);
    }

    await formatFiles(tree);
}
