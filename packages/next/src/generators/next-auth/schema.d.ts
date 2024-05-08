export interface NextAuthGeneratorSchema {
    project: string;
    provider: 'none' | 'azureAd' | 'testing';
    skipPackageJson?: boolean;
}
