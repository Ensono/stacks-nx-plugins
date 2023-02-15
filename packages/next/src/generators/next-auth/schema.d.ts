export interface NextAuthGeneratorSchema {
    project: string;
    provider: 'none' | 'azureAd' | 'azureAdB2C';
    redisAdapter?: boolean;
    redisAdapterName?: string;
    redisEnvVar?: string;
    skipPackageJson?: boolean;
}
