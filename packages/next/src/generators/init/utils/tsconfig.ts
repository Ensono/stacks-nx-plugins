import path from 'path';

import { updateJson, Tree, ProjectConfiguration } from '@nx/devkit';

const updateTsConfig = (
    tree: Tree,
    project: ProjectConfiguration,
    filePath: string,
    includesFiles?: string[],
): void => {
    updateJson(tree, filePath, tsConfig => {
        const update = tsConfig;
        const sourceFolder = path.join(project.sourceRoot, 'src');
        const filesInSource = tree
            .children(sourceFolder)
            .filter(child => tree.exists(path.join(sourceFolder, child)));
        if (filesInSource.length === 0) {
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
