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
        const children = tree.children(path.join(project.sourceRoot, 'src'));
        if (
            children.filter(child =>
                tree.exists(path.join(project.sourceRoot, 'src', child)),
            ).length === 0
        ) {
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
