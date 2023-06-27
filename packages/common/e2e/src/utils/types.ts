export type SupportedPackageManager = 'npm' | 'yarn' | 'pnpm';
export type SupportedNxPreset = 'apps' | 'react' | 'nextjs';
export type WorkspaceLibrary = {
    name: string;
    root: string;
    importKey: string | undefined;
};
