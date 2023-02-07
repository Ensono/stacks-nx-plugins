export interface InstallGeneratorSchema {
    eslint?: boolean;
    husky?: boolean;
    commitizen?: boolean;
    pipelineRunner: 'taskctl' | 'none';
}
