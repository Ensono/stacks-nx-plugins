export interface NextAuthGeneratorSchema {
    project: string;
    provider: 'none' | 'azureAd' | 'azureAdB2C';
    skipPackageJson?: boolean;
}
