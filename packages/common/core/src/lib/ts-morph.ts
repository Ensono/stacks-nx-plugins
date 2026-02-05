import { Tree } from '@nx/devkit';
import {
    Project,
    ScriptTarget,
    ObjectLiteralExpression,
    FileSystemHost,
} from 'ts-morph';

class TreeFileSystem implements FileSystemHost {
    tree: Tree;

    constructor(tree: Tree) {
        this.tree = tree;
    }

    isCaseSensitive() {
        return true;
    }

    deleteSync(path: string) {
        this.tree.delete(path);
    }

    async delete(path: string) {
        this.deleteSync(path);
    }

    readDirSync(directoryPath: string) {
        return this.tree.children(directoryPath).map(item => {
            const isFile = this.tree.isFile(item);

            return {
                name: item,
                isFile,
                isDirectory: !isFile,
                isSymlink: false,
            };
        });
    }

    readFileSync(filePath: string, encoding?: string | undefined): string {
        const buffer = this.tree.read(filePath);

        if (!buffer) {
            throw new Error(`File at path ${filePath} does not exist.`);
        }
        const bufferEncoding = encoding as BufferEncoding | undefined;

        return buffer.toString(bufferEncoding);
    }

    /* istanbul ignore next */
    async readFile(
        filePath: string,
        encoding?: string | undefined,
    ): Promise<string> {
        return this.readFileSync(filePath, encoding);
    }

    writeFileSync(filePath: string, fileText: string): void {
        this.tree.write(filePath, fileText);
    }

    async writeFile(filePath: string, fileText: string): Promise<void> {
        this.writeFileSync(filePath, fileText);
    }

    /* istanbul ignore next */

    mkdirSync(directoryPath: string): void {
        // no-op
    }

    /* istanbul ignore next */
    async mkdir(directoryPath: string): Promise<void> {
        this.mkdirSync(directoryPath);
    }

    /* istanbul ignore next */
    moveSync(sourcePath: string, destinationPath: string): void {
        this.tree.rename(sourcePath, destinationPath);
    }

    /* istanbul ignore next */
    async move(sourcePath: string, destinationPath: string): Promise<void> {
        this.moveSync(sourcePath, destinationPath);
    }

    /* istanbul ignore next */
    copySync(sourcePath: string, destinationPath: string): void {
        const content = this.readFileSync(sourcePath);

        this.writeFileSync(destinationPath, content);
    }

    /* istanbul ignore next */
    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        this.copySync(sourcePath, destinationPath);
    }

    /* istanbul ignore next */
    fileExistsSync(filePath: string): boolean {
        return this.tree.exists(filePath);
    }

    /* istanbul ignore next */
    async fileExists(filePath: string): Promise<boolean> {
        return this.fileExistsSync(filePath);
    }

    /* istanbul ignore next */
    directoryExistsSync(directoryPath: string): boolean {
        return (
            this.tree.exists(directoryPath) && !this.tree.isFile(directoryPath)
        );
    }

    /* istanbul ignore next */
    async directoryExists(directoryPath: string): Promise<boolean> {
        return this.directoryExistsSync(directoryPath);
    }

    /* istanbul ignore next */

    realpathSync(path: string): string {
        return path;
    }

    getCurrentDirectory(): string {
        return '/';
    }

    /* istanbul ignore next */

    globSync(patterns: readonly string[]): string[] {
        throw new Error('Glob is not supported');
    }

    /* istanbul ignore next */
    async glob(patterns: readonly string[]): Promise<string[]> {
        return this.globSync(patterns);
    }
}

export function tsMorphTree(tree: Tree) {
    const fs = new TreeFileSystem(tree);

    return new Project({
        fileSystem: fs,
        compilerOptions: { target: ScriptTarget.ESNext },
    });
}

export function readJsonInJs<T extends Record<string, any>>(
    node: ObjectLiteralExpression,
): T {
    const jsonInJS = node.getFullText();

    const objectJson = JSON.parse(
        jsonInJS
            .replaceAll("'", '"')
            .replaceAll(/\s"{0}(\w+?)"{0}(?=:)/g, '"$1"')
            .replaceAll(/(,)\s*(?=}|]){1}/g, ''),
    );

    return objectJson;
}

export function updateJsonInJS<
    T extends Record<string, any>,
    U extends Record<string, any>,
>(node: ObjectLiteralExpression, updater: (json: T) => U): void {
    const objectJson = readJsonInJs<T>(node);
    const update = updater(objectJson);

    const object = JSON.stringify(update, null, 2)
        .replaceAll(/"(\w+?)"(?=:)/g, '$1')
        .replaceAll(/(?!}|]){1}(\s*)(?=}|]){1}/g, ',$1');

    node.replaceWithText(object);
    const source = node.getSourceFile();

    source.saveSync();
}
