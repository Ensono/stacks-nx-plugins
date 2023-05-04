import { updateJson, Tree } from '@nx/devkit';
import minimatch from 'minimatch';
import { sortObjectByKeys } from 'nx/src/utils/object-sort';
import path from 'path';
import type * as Prettier from 'prettier';

function getRootTsConfigPath(tree: Tree): string | null {
    let tsConfigPath = null;
    ['tsconfig.base.json', 'tsconfig.json'].some(filePath => {
        const filePathExists = tree.exists(filePath);
        if (filePathExists) {
            tsConfigPath = filePath;
        }
        return filePathExists;
    });

    return tsConfigPath;
}

function sortTsConfig(tree: Tree) {
    try {
        const tsConfigPath = getRootTsConfigPath(tree);
        if (!tsConfigPath) {
            return;
        }
        updateJson(tree, tsConfigPath, tsconfig => ({
            ...tsconfig,
            compilerOptions: {
                ...tsconfig.compilerOptions,
                paths: sortObjectByKeys(tsconfig.compilerOptions.paths),
            },
        }));
    } catch {
        // catch noop
    }
}

/**
 * Formats all the created or updated files using Prettier
 * @param tree - the file system tree
 * @param excludedFiles - array of glob patterns to exclude from being formatted,
 */
export async function formatFiles(
    tree: Tree,
    excludedFiles?: string[],
): Promise<void> {
    let prettier: typeof Prettier | undefined;
    try {
        prettier = await import('prettier');
    } catch {
        // catch noop
    }

    sortTsConfig(tree);

    if (!prettier) return;

    const files = new Set(
        tree.listChanges().filter(file => {
            const globPatternMatch = excludedFiles?.some(glob => {
                return minimatch(file.path, glob);
            });

            return file.type !== 'DELETE' && !globPatternMatch;
        }),
    );
    await Promise.all(
        [...files].map(async file => {
            const systemPath = path.join(tree.root, file.path);
            let options = {
                filepath: systemPath,
            };

            const resolvedOptions = await prettier?.resolveConfig(
                process.cwd(),
                {
                    editorconfig: true,
                },
            );
            if (!resolvedOptions) {
                return;
            }
            options = {
                ...options,
                ...resolvedOptions,
            };

            const support = await prettier?.getFileInfo(
                systemPath,
                options as Prettier.FileInfoOptions,
            );
            if (support?.ignored || !support?.inferredParser) {
                return;
            }

            try {
                if (file.content?.toString('utf-8') && prettier) {
                    tree.write(
                        file.path,
                        prettier.format(
                            file.content.toString('utf-8'),
                            options,
                        ),
                    );
                }
            } catch (error) {
                console.warn(
                    `Could not format ${file.path}. Error: "${
                        (error as Error).message
                    }"`,
                );
            }
        }),
    );
}
