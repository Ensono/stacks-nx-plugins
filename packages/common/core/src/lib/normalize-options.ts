import { Tree } from '@nx/devkit';
import {
    determineProjectNameAndRootOptions,
    ensureRootProjectName,
} from '@nx/devkit/src/generators/project-name-and-root-utils';

type BaseSchema = {
    name: string;
    directory: string;
    importPath?: string;
    tags?: string;
};

export type NormalizedSchema<TSchema extends BaseSchema = BaseSchema> =
    TSchema & {
        projectName: string;
        projectRoot: string;
        parsedTags: string[];
    };

export async function normalizeOptions<TSchema extends BaseSchema>(
    tree: Tree,
    options: TSchema,
    projectType: 'application' | 'library',
): Promise<NormalizedSchema<TSchema>> {
    await ensureRootProjectName(options, projectType);

    const { projectRoot, importPath, projectName } =
        await determineProjectNameAndRootOptions(tree, {
            name: options.name,
            projectType: 'library',
            directory: options.directory,
            importPath: options.importPath,
        });

    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];

    return {
        ...options,
        importPath,
        projectName,
        projectRoot,
        parsedTags,
    };
}
