export interface NextAuthGeneratorSchema {
    name: string;
    project: string;
    directory?: string;
    provider: 'none' | 'microsoft-entra-id' | 'auth0';
    sessionStorage: 'cookie' | 'redis';
    guestSession: boolean;
    projectNameAndRootFormat: 'as-provided' | 'derived';
    importPath?: string;
    skipPackageJson?: boolean;
}
