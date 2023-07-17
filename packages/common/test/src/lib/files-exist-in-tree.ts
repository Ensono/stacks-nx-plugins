import { Tree } from '@nx/devkit';

export function checkFilesExistInTree(tree: Tree, ...files: string[]) {
    const missingFiles = files.filter(file => !tree.exists(file));
    if (missingFiles.length > 0) {
        throw new Error(
            `The following files are not present within the tree:\n${missingFiles.join(
                '\n',
            )}`,
        );
    }
}
