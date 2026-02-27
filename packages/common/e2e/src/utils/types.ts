export type WorkspaceLibrary = {
    name: string;
    root: string;
    importKey: string | undefined;
};

export enum StacksNxPreset {
    ts = 'ts',
    apps = 'apps',
    react = 'react',
    nextjs = 'nextjs',
}

export enum PackageManager {
    npm = 'npm',
    yarn = 'yarn',
    pnpm = 'pnpm',
}
