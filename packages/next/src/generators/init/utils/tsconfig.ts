import { updateJson, Tree, ProjectConfiguration } from '@nrwl/devkit';
import path from 'path';

const updateTsConfig = (
    tree: Tree,
    project: ProjectConfiguration,
    filePath: string,
    includesFiles?: string[],
): void => {
    updateJson(tree, filePath, tsconfig => {
        const update = tsconfig;
        if (tree.children(path.join(project.sourceRoot, 'src')).length === 0) {
            update.include = update.include.map((fileName: string) => {
                return fileName.replace('src/', '');
            });
        }

        update.include = [
            ...new Set([...(update.include || []), ...(includesFiles || [])]),
        ];
        return update;
    });
};

export default updateTsConfig;
