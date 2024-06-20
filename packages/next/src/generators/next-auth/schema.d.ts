export interface NextAuthGeneratorSchema {
    name: string;
    project: string;
    directory?: string;
    provider: 'none' | 'microsoft-entra-id' | 'auth0';
    sessionStorage: 'cookie' | 'redis';
    guestSession: boolean;
    importPath?: string;
    skipPackageJson?: boolean;
}
