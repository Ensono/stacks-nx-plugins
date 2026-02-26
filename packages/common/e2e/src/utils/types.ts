export type SupportedPackageManager = 'npm' | 'yarn' | 'pnpm';
export type SupportedNxPreset = 'apps' | 'react' | 'nextjs';
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
