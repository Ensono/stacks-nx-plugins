export interface InstallGeneratorSchema {
    cloudProvider: 'azure';
    pipelineProvider: 'azdo';
    eslint?: boolean;
    husky?: boolean;
    commitizen?: boolean;
}
