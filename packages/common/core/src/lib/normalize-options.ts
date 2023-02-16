import { getWorkspaceLayout, names, Tree } from '@nrwl/devkit';

type BaseSchema = {
    name: string;
    directory?: string;
    tags?: string;
};

export type NormalizedSchema<TSchema extends BaseSchema> = TSchema & {
    projectName: string;
    projectRoot: string;
    projectDirectory: string;
    parsedTags: string[];
};

export function normalizeOptions<TSchema extends BaseSchema>(
    tree: Tree,
    options: TSchema,
): NormalizedSchema<TSchema> {
    const name = names(options.name).fileName;
    const projectDirectory = options.directory
        ? `${names(options.directory).fileName}/${name}`
        : name;
    const projectName = projectDirectory.replace(/\//g, '-');
    const projectRoot = `${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;
    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags,
    };
}
