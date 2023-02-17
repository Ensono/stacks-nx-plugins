import { Tree } from '@nrwl/devkit';
import path from 'path';

function copyFile(tree: Tree, sourcePath: string, targetPath: string) {
    tree.write(targetPath, tree.read(sourcePath) ?? '');
}

function copyDirectory(tree: Tree, sourcePath: string, targetPath: string) {
    tree.children(sourcePath).forEach(fileName => {
        const filePath = path.join(sourcePath, fileName);
        const targetFilePath = path.join(targetPath, fileName);

        if (!tree.isFile(filePath)) {
            copyDirectory(tree, filePath, targetFilePath);
            return;
        }

        copyFile(tree, filePath, targetFilePath);
    });
}

/**
 * Copy files recursively from one path to another.
 */
export function copyFiles(tree: Tree, sourcePath: string, targetPath: string) {
    if (tree.isFile(sourcePath)) {
        copyFile(tree, sourcePath, targetPath);
        return;
    }

    copyDirectory(tree, sourcePath, targetPath);
}
