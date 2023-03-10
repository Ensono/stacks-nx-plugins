import { getWorkspaceLayout, names, Tree } from '@nrwl/devkit';
import path from 'path';

type BaseSchema = {
    name: string;
    directory?: string;
    tags?: string;
};

export type NormalizedSchema<TSchema extends BaseSchema = BaseSchema> =
    TSchema & {
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

    // nx removes special dir names when generating a project
    // which prevents `--dir libs` resulting in `libs/libs/projectname` path
    // we should follow this approach too
    // @see https://github.com/nrwl/nx/blob/master/packages/devkit/src/utils/get-workspace-layout.ts#L45
    const directory =
        options.directory &&
        !['apps', 'libs', 'packages'].includes(options.directory)
            ? options.directory
            : null;

    const projectDirectory = directory
        ? path.join(names(directory).fileName, name)
        : name;
    const projectRoot = path.join(
        getWorkspaceLayout(tree).libsDir,
        projectDirectory,
    );

    const projectName = projectDirectory
        .replace(/\//g, '-')
        .replace(/\\/g, '-');

    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        directory,
        projectName,
        projectRoot,
        projectDirectory,
        parsedTags,
    };
}
