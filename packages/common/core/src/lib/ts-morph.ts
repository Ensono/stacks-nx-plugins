import { joinPathFragments, Tree, workspaceRoot } from '@nrwl/devkit';
import { Project, ScriptTarget, SourceFile, FileSystemHost } from 'ts-morph';

class TreeFileSystem implements FileSystemHost {
    tree: Tree;

    constructor(tree: Tree) {
        this.tree = tree;
    }

    // eslint-disable-next-line class-methods-use-this
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

    // eslint-disable-next-line class-methods-use-this
    mkdirSync(directoryPath: string): void {
        // no-op
    }

    async mkdir(directoryPath: string): Promise<void> {
        this.mkdirSync(directoryPath);
    }

    moveSync(sourcePath: string, destinationPath: string): void {
        this.tree.rename(sourcePath, destinationPath);
    }

    async move(sourcePath: string, destinationPath: string): Promise<void> {
        this.moveSync(sourcePath, destinationPath);
    }

    copySync(sourcePath: string, destinationPath: string): void {
        const content = this.readFileSync(sourcePath);
        this.writeFileSync(destinationPath, content);
    }

    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        this.copySync(sourcePath, destinationPath);
    }

    fileExistsSync(filePath: string): boolean {
        return this.tree.exists(filePath);
    }

    async fileExists(filePath: string): Promise<boolean> {
        return this.fileExistsSync(filePath);
    }

    directoryExistsSync(directoryPath: string): boolean {
        return (
            this.tree.exists(directoryPath) && !this.tree.isFile(directoryPath)
        );
    }

    async directoryExists(directoryPath: string): Promise<boolean> {
        return this.directoryExistsSync(directoryPath);
    }

    // eslint-disable-next-line class-methods-use-this
    realpathSync(path: string): string {
        return path;
    }

    // eslint-disable-next-line class-methods-use-this
    getCurrentDirectory(): string {
        return '/';
    }

    // eslint-disable-next-line class-methods-use-this
    globSync(patterns: readonly string[]): string[] {
        throw new Error('Glob is not supported');
    }

    async glob(patterns: readonly string[]): Promise<string[]> {
        return this.globSync(patterns);
    }
}

export const tsMorphTree = (tree: Tree) => {
    const fs = new TreeFileSystem(tree);
    return new Project({
        fileSystem: fs,
        compilerOptions: { target: ScriptTarget.ESNext },
    });
};
