export interface NextAuthGeneratorSchema {
    project: string;
    provider: 'none' | 'azureAd';
    skipPackageJson?: boolean;
}
