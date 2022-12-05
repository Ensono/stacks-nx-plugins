import { FileChange, readJson, Tree, formatFiles } from '@nrwl/devkit';
import type { Linter } from 'eslint';
import path from 'path';

import { readJsonInJS } from './tsquery';

export function nearestEslintConfigPath(
    tree: Tree,
    filePath: string,
): false | string {
    const directory = path.dirname(filePath);
    const normaliseDirectory = directory === '.' ? '' : directory;

    const configPath: false | string =
        (tree.exists(path.join(normaliseDirectory, '.eslintrc.json')) &&
            path.join(normaliseDirectory, '.eslintrc.json')) ||
        (tree.exists(path.join(normaliseDirectory, '.eslintrc.js')) &&
            path.join(normaliseDirectory, '.eslintrc.js'));

    if (!configPath && normaliseDirectory) {
        return nearestEslintConfigPath(tree, directory);
    }

    return configPath;
}

export function readEslintConfig(tree: Tree, filePath: string): Linter.Config {
    const isConfig =
        filePath.includes('eslintrc.json') || filePath.includes('eslintrc.js');

    const configPath = !isConfig
        ? nearestEslintConfigPath(tree, filePath)
        : filePath;

    if (configPath) {
        if (configPath.endsWith('.json')) {
            return readJson(tree, configPath);
        }

        if (configPath.endsWith('js')) {
            return readJsonInJS(
                tree,
                configPath,
                'BinaryExpression > ObjectLiteralExpression',
            );
        }
    }

    // Could provide a sensible default config
    return {};
}

export function sortFilesByEslintConfig(tree: Tree, files: FileChange[]) {
    const sortedFiles: Record<string, FileChange[]> = {};

    files.forEach(file => {
        const configPath = nearestEslintConfigPath(tree, file.path);
        if (!sortedFiles[`${configPath}`]) {
            sortedFiles[`${configPath}`] = [];
        }
        sortedFiles[`${configPath}`].push(file);
    });

    return sortedFiles;
}

export async function formatFilesWithEslint(tree: Tree) {
    try {
        const ESLint = await import('eslint').then(module => module.ESLint);
        const sortedFiles = sortFilesByEslintConfig(tree, tree.listChanges());
        Object.entries(sortedFiles).forEach(([configPath, files]) => {
            const eslintConfig = readEslintConfig(tree, configPath);
            const eslint = new ESLint({
                fix: true,
                overrideConfig: {
                    ...eslintConfig,
                    ignorePatterns: ['!**/*'],
                },
                useEslintrc: false,
            });

            files.forEach(async change => {
                if (path.extname(change.path) === '') {
                    return;
                }
                if (change.content) {
                    const [result] = await eslint.lintText(
                        change.content.toString(),
                        {
                            filePath: change.path,
                        },
                    );

                    if (result.output) {
                        tree.write(change.path, result.output);
                    }
                }
            });
        });
    } catch {
        console.log('Unable to lint with Eslint, falling back to prettier');
        await formatFiles(tree);
    }
}
